import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createOrderSchema, updateOrderStatusSchema, validateBody } from '@/lib/schemas';
import { broadcastOrderCreated, broadcastOrderUpdated } from '@/lib/events';
import { requireRole } from '@/lib/auth';
import { resolveDelivery } from '@/lib/delivery';
import { isWithinOpeningHours } from '@/lib/restaurantHours';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function serializeOrder(order: any) {
  return {
    ...order,
    subTotal: Number(order.subTotal),
    deliveryFee: Number(order.deliveryFee),
    totalAmount: Number(order.totalAmount),
    items: order.items?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      options: item.options?.map((option: any) => ({ ...option, priceDelta: Number(option.priceDelta) })) || [],
    })),
    payments: order.payments?.map((payment: any) => ({ ...payment, amount: Number(payment.amount) })),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber') || searchParams.get('shortId');

    if (orderNumber) {
      const order = await db.order.findUnique({
        where: { orderNumber: orderNumber.trim().toUpperCase() },
        select: {
          orderNumber: true,
          status: true,
          totalAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
          statusHistory: { select: { status: true, note: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        },
      });
      if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      return NextResponse.json({ ...order, shortId: order.orderNumber, totalAmount: Number(order.totalAmount) });
    }

    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const restaurantId = searchParams.get('restaurantId');
    const slug = searchParams.get('slug');
    let resolvedRestaurantId = restaurantId || undefined;
    if (!resolvedRestaurantId && slug) {
      const restaurant = await db.restaurant.findUnique({ where: { slug: slug.toLowerCase() }, select: { id: true } });
      resolvedRestaurantId = restaurant?.id;
      if (!resolvedRestaurantId) return NextResponse.json([]);
    }

    const orders = await db.order.findMany({
      where: resolvedRestaurantId ? { restaurantId: resolvedRestaurantId } : undefined,
      include: {
        customer: true,
        restaurant: { select: { id: true, name: true, slug: true } },
        items: { include: { options: true } },
        payments: true,
        statusHistory: { include: { createdBy: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders.map((order) => ({ ...serializeOrder(order), shortId: order.orderNumber, subtotal: Number(order.subTotal), orderItems: serializeOrder(order).items })));
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(request, ['SUPER_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const validationResult = validateBody(updateOrderStatusSchema, await request.json());
    if (validationResult instanceof NextResponse) return validationResult;
    const { id, status, paymentStatus, adminNote } = validationResult.data;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (status && status !== existing.status && !STATUS_TRANSITIONS[existing.status]?.includes(status)) {
      return NextResponse.json({ error: `Order cannot move from ${existing.status} to ${status}.` }, { status: 409 });
    }

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(status !== undefined ? { status } : {}),
          ...(paymentStatus !== undefined ? { paymentStatus } : {}),
          ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
        },
      });

      if (status && status !== existing.status) {
        await tx.orderStatusHistory.create({
          data: { orderId: id, status, note: adminNote || null, createdById: authResult.user.id },
        });
      }
      if (paymentStatus) {
        await tx.payment.updateMany({ where: { orderId: id }, data: { status: paymentStatus } });
      }
      return order;
    });

    broadcastOrderUpdated(updated);
    return NextResponse.json({ ...updated, shortId: updated.orderNumber, subtotal: Number(updated.subTotal), deliveryFee: Number(updated.deliveryFee), totalAmount: Number(updated.totalAmount) });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const validationResult = validateBody(createOrderSchema, await request.json());
    if (validationResult instanceof NextResponse) return validationResult;
    const input = validationResult.data;

    const restaurant = await db.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: { deliveryZones: { where: { isActive: true } } },
    });
    if (!restaurant || !restaurant.isActive) return NextResponse.json({ error: 'Restaurant is unavailable.' }, { status: 404 });
    if (!restaurant.isOpen) return NextResponse.json({ error: 'Restaurant is currently closed.' }, { status: 409 });
    if (!isWithinOpeningHours(restaurant.openingTime, restaurant.closingTime)) {
      return NextResponse.json({ error: 'Restaurant is outside its opening hours.' }, { status: 409 });
    }

    const coordinates = input.customer.latitude != null && input.customer.longitude != null
      ? { latitude: input.customer.latitude, longitude: input.customer.longitude }
      : null;
    const delivery = resolveDelivery(restaurant.deliveryZones, coordinates, Number(restaurant.deliveryFee));
    if (!delivery.available) {
      return NextResponse.json({
        error: delivery.requiresCoordinates
          ? 'Your location is required to select a delivery zone.'
          : 'This address is outside the configured delivery zones.',
      }, { status: 400 });
    }

    const requestedProductIds = [...new Set(input.orderItems.map((item) => item.productId))];
    const products = await db.menuItem.findMany({
      where: { id: { in: requestedProductIds }, restaurantId: restaurant.id, isActive: true, isAvailable: true, category: { isActive: true } },
      include: {
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: { items: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (products.length !== requestedProductIds.length) {
      return NextResponse.json({ error: 'One or more products are unavailable or belong to another restaurant.' }, { status: 400 });
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const pricedItems: Array<{
      product: (typeof products)[number]; quantity: number; unitPrice: number; totalPrice: number;
      selected: Array<{ optionId: string; optionItemId: string; name: string; priceDelta: number }>;
    }> = [];

    for (const requested of input.orderItems) {
      const product = productsById.get(requested.productId)!;
      const selectedIds = new Set(requested.optionItemIds);
      if (selectedIds.size !== requested.optionItemIds.length) {
        return NextResponse.json({ error: `Duplicate option selection for ${product.name}.` }, { status: 400 });
      }

      const selected: Array<{ optionId: string; optionItemId: string; name: string; priceDelta: number }> = [];
      for (const option of product.options) {
        const matches = option.items.filter((item) => selectedIds.has(item.id));
        if (option.isRequired && matches.length !== 1) {
          return NextResponse.json({ error: `${product.name}: choose one ${option.name}.` }, { status: 400 });
        }
        if (matches.length > 1) {
          return NextResponse.json({ error: `${product.name}: choose only one ${option.name}.` }, { status: 400 });
        }
        for (const item of matches) {
          selected.push({ optionId: option.id, optionItemId: item.id, name: item.name, priceDelta: Number(item.priceDelta) });
          selectedIds.delete(item.id);
        }
      }
      if (selectedIds.size > 0) return NextResponse.json({ error: `Invalid option selected for ${product.name}.` }, { status: 400 });

      const unitPrice = money(Number(product.basePrice) + selected.reduce((sum, option) => sum + option.priceDelta, 0));
      pricedItems.push({ product, quantity: requested.quantity, unitPrice, totalPrice: money(unitPrice * requested.quantity), selected });
    }

    const subTotal = money(pricedItems.reduce((sum, item) => sum + item.totalPrice, 0));
    if (subTotal < Number(restaurant.minimumOrderAmount)) {
      return NextResponse.json({ error: `Minimum order amount is ${Number(restaurant.minimumOrderAmount).toFixed(2)}.` }, { status: 400 });
    }
    const discountAmount = 0;
    const deliveryFee = money(delivery.fee);
    const totalAmount = money(subTotal - discountAmount + deliveryFee);
    const orderNumber = `D2D-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const created = await db.$transaction(async (tx) => {
      const customer = await tx.customer.create({ data: input.customer });
      const order = await tx.order.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          orderNumber,
          status: 'pending',
          subTotal,
          deliveryFee,
          totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          address: input.customer.address,
          latitude: input.customer.latitude,
          longitude: input.customer.longitude,
          customerNote: input.customerNote || null,
        },
      });

      for (const item of pricedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.images[0]?.imageUrl || item.product.imageUrl,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            options: { create: item.selected },
          },
        });
      }
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'pending', note: 'Guest order placed.' } });
      await tx.payment.create({ data: { orderId: order.id, method: input.paymentMethod, status: 'pending', amount: totalAmount } });
      return order;
    });

    const finalOrder = await db.order.findUnique({
      where: { id: created.id },
      include: { customer: true, items: { include: { options: true } }, payments: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
    broadcastOrderCreated(finalOrder);
    return NextResponse.json({
      ...serializeOrder(finalOrder),
      shortId: orderNumber,
      subtotal: subTotal,
      discountAmount,
      deliveryZone: delivery.zone,
    }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
