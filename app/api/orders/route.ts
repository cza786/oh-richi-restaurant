import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { awardPointsForOrder, reversePointsForRefund, applyRewardToOrder } from '@/lib/loyaltyService';
import { extractTokenFromRequest, getJwtSecret } from '@/lib/auth';
import { createOrderSchema, updateOrderStatusSchema, validateBody } from '@/lib/schemas';
import { broadcastOrderCreated, broadcastOrderUpdated } from '@/lib/events';
import jwt from 'jsonwebtoken';

// GET orders (optional filter by restaurantId or slug)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const slug = searchParams.get('slug');

    const whereClause: any = {};

    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    } else if (slug) {
      const restaurant = await db.restaurant.findUnique({
        where: { slug: slug.toLowerCase() },
      });
      if (restaurant) {
        whereClause.restaurantId = restaurant.id;
      }
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format fields for frontend compatibility
    const formattedOrders = orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      deliveryFee: Number(order.deliveryFee),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT update order status (Wrapped in Prisma transaction & Zod Schema Validation)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const validationResult = validateBody(updateOrderStatusSchema, body);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }

    const { id, status, paymentStatus } = validationResult.data;

    const updatedOrder = await db.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (status !== undefined) dataToUpdate.status = status;
      if (paymentStatus !== undefined) dataToUpdate.paymentStatus = paymentStatus;

      const order = await tx.order.update({
        where: { id },
        data: dataToUpdate,
      });

      // Create status change history log in DB
      if (status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status: status,
            notes: 'Updated via manager dashboard POS interface.',
          },
        });
      }

      return order;
    });

    // Trigger Loyalty actions dynamically
    if (updatedOrder.status === 'COMPLETED' && updatedOrder.paymentStatus === 'PAID') {
      await awardPointsForOrder(id);
    } else if (updatedOrder.status === 'CANCELLED' || updatedOrder.paymentStatus === 'REFUNDED') {
      await reversePointsForRefund(id);
    }

    // Broadcast live SSE event to KDS and dashboards
    broadcastOrderUpdated(updatedOrder);

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create customer order (Atomic Checkout Transaction & Zod Schema Validation)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validationResult = validateBody(createOrderSchema, body);
    if (validationResult instanceof NextResponse) {
      return validationResult;
    }

    const {
      locationId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      tableId,
      orderType,
      subtotal,
      taxAmount,
      deliveryFee,
      discountAmount,
      totalAmount,
      specialInstructions,
      deliveryAddress,
      orderItems,
      couponCode,
      redemptionCode,
    } = validationResult.data;

    // 1. Resolve customerId from session token if present and customerId not provided
    let resolvedCustomerId = customerId || null;
    if (!resolvedCustomerId) {
      const token = extractTokenFromRequest(request);
      if (token) {
        try {
          const secret = getJwtSecret();
          const decoded = jwt.verify(token, secret) as any;
          resolvedCustomerId = decoded.userId;
        } catch (e) {
          // ignore invalid token for guest checkouts
        }
      }
    }

    // 2. Validate location exists, or use default
    let targetLocation = null;
    if (locationId) {
      targetLocation = await db.restaurantLocation.findUnique({ where: { id: locationId } });
    }
    if (!targetLocation) {
      targetLocation = await db.restaurantLocation.findFirst();
      if (!targetLocation) {
        return NextResponse.json({ error: 'No restaurant location configured.' }, { status: 400 });
      }
    }
    const resolvedLocationId = targetLocation.id;
    const resolvedRestaurantId = validationResult.data.restaurantId || targetLocation.restaurantId;

    // 3. Generate unique shortId
    let shortId = '';
    let exists = true;
    while (exists) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      shortId = `OR-${randNum}`;
      const existingOrder = await db.order.findUnique({
        where: { shortId },
      });
      if (!existingOrder) {
        exists = false;
      }
    }

    // 4. Create Order & Items inside an atomic transaction
    const createdOrder = await db.$transaction(async (tx) => {
      // Create main Order record
      const order = await tx.order.create({
        data: {
          shortId,
          restaurantId: resolvedRestaurantId,
          locationId: resolvedLocationId,
          customerId: resolvedCustomerId,
          customerName,
          customerPhone,
          customerEmail,
          tableId: tableId || null,
          orderType,
          status: 'PENDING',
          subtotal: Number(subtotal),
          taxAmount: Number(taxAmount || 0),
          deliveryFee: Number(deliveryFee || 0),
          discountAmount: Number(discountAmount || 0),
          totalAmount: Number(totalAmount),
          specialInstructions: specialInstructions || null,
          deliveryAddress: deliveryAddress || null,
          paymentStatus: 'PAID', // In customer web app, mock card payment success on checkout
        },
      });

      // Create Order Items and their Addons
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const orderItem = await tx.orderItem.create({
            data: {
              orderId: order.id,
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              notes: item.notes || null,
            },
          });
        }
      }

      // If couponCode was applied, create CouponRedemption
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.trim().toUpperCase() },
        });
        if (coupon) {
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              userId: resolvedCustomerId,
              orderId: order.id,
            },
          });

          // Update coupon usage count
          await tx.coupon.update({
            where: { id: coupon.id },
            data: {
              currentUsageCount: { increment: 1 },
            },
          });
        }
      }


      // Create status history log
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          notes: 'Order placed online by customer.',
        },
      });

      return order;
    });

    // 5. If redemptionCode is present, apply reward to deduct points
    if (redemptionCode) {
      try {
        await applyRewardToOrder(createdOrder.id, redemptionCode);
      } catch (err) {
        console.error('Error applying reward redemption in POST order:', err);
      }
    }

    // Refresh the order to get the final fields after redemption application
    const finalOrder = await db.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Broadcast live SSE event to KDS and dashboards
    broadcastOrderCreated(finalOrder);

    return NextResponse.json(finalOrder);
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
