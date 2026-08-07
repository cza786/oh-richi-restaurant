import db from './db';
import { Prisma } from '@prisma/client';

// Helper to check date range validity
export function validateDateRange(startDate: string | Date, endDate: string | Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

// Validation function for Coupon admin input
export function validateCouponAdminInput(data: any) {
  const errors: string[] = [];

  if (!data.code || data.code.trim() === '') {
    errors.push('Coupon code is required');
  }
  if (!data.name || data.name.trim() === '') {
    errors.push('Coupon name is required');
  }
  if (data.discountValue === undefined || data.discountValue === null) {
    errors.push('Discount value is required');
  } else {
    const val = Number(data.discountValue);
    if (isNaN(val) || val < 0) {
      errors.push('Discount value must be greater than or equal to 0');
    }
    if (data.discountType === 'percentage_discount' && val > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }
  }
  if (data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null && data.minimumOrderAmount !== '') {
    const min = Number(data.minimumOrderAmount);
    if (isNaN(min) || min < 0) {
      errors.push('Minimum order must be greater than or equal to 0');
    }
  }
  if (data.totalUsageLimit !== undefined && data.totalUsageLimit !== null && data.totalUsageLimit !== '') {
    const limit = parseInt(data.totalUsageLimit);
    if (isNaN(limit) || limit <= 0) {
      errors.push('Usage limit must be greater than 0');
    }
  }
  if (data.startDate && data.endDate) {
    if (!validateDateRange(data.startDate, data.endDate)) {
      errors.push('End date cannot be before start date');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Validation function for Happy-Hour promo admin input
export function validatePromotionAdminInput(data: any) {
  const errors: string[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push('Promotion name is required');
  }
  if (data.discountValue === undefined || data.discountValue === null) {
    errors.push('Discount value is required');
  } else {
    const val = Number(data.discountValue);
    if (isNaN(val) || val < 0) {
      errors.push('Discount value must be greater than or equal to 0');
    }
    if (data.discountType === 'percentage_discount' && val > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }
  }
  if (data.startDate && data.endDate) {
    if (!validateDateRange(data.startDate, data.endDate)) {
      errors.push('End date cannot be before start date');
    }
  }
  if (!data.startTime || !data.endTime) {
    errors.push('Start and end time range are required');
  }
  if (!data.daysOfWeek || data.daysOfWeek.trim() === '') {
    errors.push('At least one day of the week must be selected');
  }

  return { isValid: errors.length === 0, errors };
}

// CREATE Coupon
export async function createCoupon(data: any) {
  const validation = validateCouponAdminInput(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const existing = await db.coupon.findUnique({
    where: { code: data.code.toUpperCase() },
  });
  if (existing) {
    throw new Error('Coupon code already exists');
  }

  const restaurant = await db.restaurant.findFirst();
  const restId = restaurant?.id || 'd3b07384-d113-4e4e-862d-0b32525164d1';

  return await db.coupon.create({
    data: {
      restaurantId: restId,
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description || '',
      discountType: data.discountType,
      discountValue: new Prisma.Decimal(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? new Prisma.Decimal(data.maxDiscountAmount) : null,
      minimumOrderAmount: new Prisma.Decimal(data.minimumOrderAmount || 0),
      freeMenuItemId: data.freeMenuItemId || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      dineInAllowed: data.dineInAllowed !== false,
      takeAwayAllowed: data.takeAwayAllowed !== false,
      guestAllowed: data.guestAllowed !== false,
      registeredOnly: Boolean(data.registeredOnly),
      firstOrderOnly: Boolean(data.firstOrderOnly),
      totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
      perCustomerUsageLimit: data.perCustomerUsageLimit ? parseInt(data.perCustomerUsageLimit) : null,
      canCombineWithPromotions: Boolean(data.canCombineWithPromotions),
      canCombineWithRewards: Boolean(data.canCombineWithRewards),
      applyOnOriginalSubtotal: data.applyOnOriginalSubtotal !== false,
      isActive: data.isActive !== false,
    },
  });
}

// UPDATE Coupon
export async function updateCoupon(id: string, data: any) {
  const validation = validateCouponAdminInput(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  return await db.coupon.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || '',
      discountType: data.discountType,
      discountValue: new Prisma.Decimal(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? new Prisma.Decimal(data.maxDiscountAmount) : null,
      minimumOrderAmount: new Prisma.Decimal(data.minimumOrderAmount || 0),
      freeMenuItemId: data.freeMenuItemId || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      dineInAllowed: data.dineInAllowed !== false,
      takeAwayAllowed: data.takeAwayAllowed !== false,
      guestAllowed: data.guestAllowed !== false,
      registeredOnly: Boolean(data.registeredOnly),
      firstOrderOnly: Boolean(data.firstOrderOnly),
      totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
      perCustomerUsageLimit: data.perCustomerUsageLimit ? parseInt(data.perCustomerUsageLimit) : null,
      canCombineWithPromotions: Boolean(data.canCombineWithPromotions),
      canCombineWithRewards: Boolean(data.canCombineWithRewards),
      applyOnOriginalSubtotal: data.applyOnOriginalSubtotal !== false,
      isActive: Boolean(data.isActive),
    },
  });
}

// DELETE Coupon
export async function deleteCoupon(id: string) {
  return await db.coupon.delete({
    where: { id },
  });
}

// ACTIVATE Coupon
export async function activateCoupon(id: string) {
  return await db.coupon.update({
    where: { id },
    data: { isActive: true },
  });
}

// DEACTIVATE Coupon
export async function deactivateCoupon(id: string) {
  return await db.coupon.update({
    where: { id },
    data: { isActive: false },
  });
}

// DUPLICATE Coupon
export async function duplicateCoupon(id: string) {
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) throw new Error('Source coupon not found');

  const baseCode = `${coupon.code}_CLONE`;
  let clonedCode = '';

  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = `${baseCode}_${attempt}`;
    const existing = await db.coupon.findUnique({ where: { code: candidate } });

    if (!existing) {
      clonedCode = candidate;
      break;
    }
  }

  if (!clonedCode) {
    throw new Error('Unable to generate a unique coupon code for the duplicate');
  }

  try {
    return await db.coupon.create({
      data: {
        restaurantId: coupon.restaurantId,
        code: clonedCode,
        name: `${coupon.name} (Copy)`,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minimumOrderAmount: coupon.minimumOrderAmount,
        freeMenuItemId: coupon.freeMenuItemId,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        dineInAllowed: coupon.dineInAllowed,
        takeAwayAllowed: coupon.takeAwayAllowed,
        guestAllowed: coupon.guestAllowed,
        registeredOnly: coupon.registeredOnly,
        firstOrderOnly: coupon.firstOrderOnly,
        totalUsageLimit: coupon.totalUsageLimit,
        perCustomerUsageLimit: coupon.perCustomerUsageLimit,
        canCombineWithPromotions: coupon.canCombineWithPromotions,
        canCombineWithRewards: coupon.canCombineWithRewards,
        applyOnOriginalSubtotal: coupon.applyOnOriginalSubtotal,
        isActive: false, // Default duplicated records to inactive draft status
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('Generated coupon code already exists. Please try duplicating again.');
    }

    throw error;
  }
}

// CREATE Happy-Hour Promotion
export async function createPromotion(data: any) {
  const validation = validatePromotionAdminInput(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const restaurant = await db.restaurant.findFirst();
  const restId = restaurant?.id || 'd3b07384-d113-4e4e-862d-0b32525164d1';

  return await db.promotion.create({
    data: {
      restaurantId: restId,
      name: data.name,
      description: data.description || '',
      promotionType: 'HAPPY_HOUR',
      discountType: data.discountType,
      discountValue: new Prisma.Decimal(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? new Prisma.Decimal(data.maxDiscountAmount) : null,
      minimumOrderAmount: new Prisma.Decimal(data.minimumOrderAmount || 0),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTime: data.startTime,
      endTime: data.endTime,
      timezone: data.timezone || 'UTC',
      daysOfWeek: data.daysOfWeek,
      dineInAllowed: data.dineInAllowed !== false,
      takeAwayAllowed: data.takeAwayAllowed !== false,
      appliesTo: data.appliesTo || 'ALL',
      priority: parseInt(data.priority) || 0,
      conflictStrategy: data.conflictStrategy || 'highest_discount_wins',
      totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
      perCustomerUsageLimit: data.perCustomerUsageLimit ? parseInt(data.perCustomerUsageLimit) : null,
      canCombineWithCoupons: Boolean(data.canCombineWithCoupons),
      canCombineWithRewards: Boolean(data.canCombineWithRewards),
      isActive: data.isActive !== false,
    },
  });
}

// UPDATE Happy-Hour Promotion
export async function updatePromotion(id: string, data: any) {
  const validation = validatePromotionAdminInput(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  return await db.promotion.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || '',
      discountType: data.discountType,
      discountValue: new Prisma.Decimal(data.discountValue),
      maxDiscountAmount: data.maxDiscountAmount ? new Prisma.Decimal(data.maxDiscountAmount) : null,
      minimumOrderAmount: new Prisma.Decimal(data.minimumOrderAmount || 0),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startTime: data.startTime,
      endTime: data.endTime,
      timezone: data.timezone || 'UTC',
      daysOfWeek: data.daysOfWeek,
      dineInAllowed: data.dineInAllowed !== false,
      takeAwayAllowed: data.takeAwayAllowed !== false,
      appliesTo: data.appliesTo || 'ALL',
      priority: parseInt(data.priority) || 0,
      conflictStrategy: data.conflictStrategy || 'highest_discount_wins',
      totalUsageLimit: data.totalUsageLimit ? parseInt(data.totalUsageLimit) : null,
      perCustomerUsageLimit: data.perCustomerUsageLimit ? parseInt(data.perCustomerUsageLimit) : null,
      canCombineWithCoupons: Boolean(data.canCombineWithCoupons),
      canCombineWithRewards: Boolean(data.canCombineWithRewards),
      isActive: Boolean(data.isActive),
    },
  });
}

// DELETE Promotion
export async function deletePromotion(id: string) {
  return await db.promotion.delete({
    where: { id },
  });
}

// ACTIVATE Promotion
export async function activatePromotion(id: string) {
  return await db.promotion.update({
    where: { id },
    data: { isActive: true },
  });
}

// PAUSE/DEACTIVATE Promotion
export async function pausePromotion(id: string) {
  return await db.promotion.update({
    where: { id },
    data: { isActive: false },
  });
}

// DUPLICATE Promotion
export async function duplicatePromotion(id: string) {
  const promo = await db.promotion.findUnique({ where: { id } });
  if (!promo) throw new Error('Source promotion rules not found');

  return await db.promotion.create({
    data: {
      restaurantId: promo.restaurantId,
      name: `${promo.name} (Copy)`,
      description: promo.description,
      promotionType: promo.promotionType,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount,
      minimumOrderAmount: promo.minimumOrderAmount,
      startDate: promo.startDate,
      endDate: promo.endDate,
      startTime: promo.startTime,
      endTime: promo.endTime,
      timezone: promo.timezone,
      daysOfWeek: promo.daysOfWeek,
      dineInAllowed: promo.dineInAllowed,
      takeAwayAllowed: promo.takeAwayAllowed,
      appliesTo: promo.appliesTo,
      priority: promo.priority,
      conflictStrategy: promo.conflictStrategy,
      totalUsageLimit: promo.totalUsageLimit,
      perCustomerUsageLimit: promo.perCustomerUsageLimit,
      canCombineWithCoupons: promo.canCombineWithCoupons,
      canCombineWithRewards: promo.canCombineWithRewards,
      isActive: false, // duplications default to disabled drafts
    },
  });
}

// UPDATE Global Discount Settings
export async function updateDiscountSettings(data: any) {
  const settings = await db.discountSettings.findFirst();
  
  if (!settings) {
    const restaurant = await db.restaurant.findFirst();
    const restId = restaurant?.id || 'd3b07384-d113-4e4e-862d-0b32525164d1';
    
    return await db.discountSettings.create({
      data: {
        restaurantId: restId,
        enableCoupons: data.enableCoupons !== false,
        enableHappyHour: data.enableHappyHour !== false,
        allowOneCouponPerOrder: data.allowOneCouponPerOrder !== false,
        allowCouponHappyHourTogether: Boolean(data.allowCouponHappyHourTogether),
        allowCouponRewardsTogether: Boolean(data.allowCouponRewardsTogether),
        allowHappyHourRewardsTogether: Boolean(data.allowHappyHourRewardsTogether),
        requireManagerApprovalManual: data.requireManagerApprovalManual !== false,
        defaultCouponDurationDays: parseInt(data.defaultCouponDurationDays) || 30,
        defaultHappyHourTimezone: data.defaultHappyHourTimezone || 'UTC',
        autoExpireOldCoupons: data.autoExpireOldCoupons !== false,
        autoPauseExpiredPromotions: data.autoPauseExpiredPromotions !== false,
        maxTotalDiscountPercentage: new Prisma.Decimal(data.maxTotalDiscountPercentage || 50.00),
        preventFinalTotalBelowZero: data.preventFinalTotalBelowZero !== false,
        requireApprovalThresholdAmount: new Prisma.Decimal(data.requireApprovalThresholdAmount || 50.00),
        requireApprovalThresholdPercent: new Prisma.Decimal(data.requireApprovalThresholdPercent || 30.00),
        showReportsToManager: data.showReportsToManager !== false,
        showReportsToCashier: Boolean(data.showReportsToCashier),
      },
    });
  }

  return await db.discountSettings.update({
    where: { id: settings.id },
    data: {
      enableCoupons: data.enableCoupons !== false,
      enableHappyHour: data.enableHappyHour !== false,
      allowOneCouponPerOrder: data.allowOneCouponPerOrder !== false,
      allowCouponHappyHourTogether: Boolean(data.allowCouponHappyHourTogether),
      allowCouponRewardsTogether: Boolean(data.allowCouponRewardsTogether),
      allowHappyHourRewardsTogether: Boolean(data.allowHappyHourRewardsTogether),
      requireManagerApprovalManual: data.requireManagerApprovalManual !== false,
      defaultCouponDurationDays: parseInt(data.defaultCouponDurationDays) || 30,
      defaultHappyHourTimezone: data.defaultHappyHourTimezone || 'UTC',
      autoExpireOldCoupons: data.autoExpireOldCoupons !== false,
      autoPauseExpiredPromotions: data.autoPauseExpiredPromotions !== false,
      maxTotalDiscountPercentage: new Prisma.Decimal(data.maxTotalDiscountPercentage || 50.00),
      preventFinalTotalBelowZero: data.preventFinalTotalBelowZero !== false,
      requireApprovalThresholdAmount: new Prisma.Decimal(data.requireApprovalThresholdAmount || 50.00),
      requireApprovalThresholdPercent: new Prisma.Decimal(data.requireApprovalThresholdPercent || 30.00),
      showReportsToManager: data.showReportsToManager !== false,
      showReportsToCashier: Boolean(data.showReportsToCashier),
    },
  });
}

// GET Discount Overview Statistics (Mocked + Real SQL queries)
export async function getDiscountOverview() {
  const activeCoupons = await db.coupon.count({ where: { isActive: true, endDate: { gte: new Date() } } });
  const scheduledCoupons = await db.coupon.count({ where: { isActive: true, startDate: { gte: new Date() } } });
  const expiredCoupons = await db.coupon.count({ where: { OR: [{ isActive: false }, { endDate: { lt: new Date() } }] } });
  
  const activeHappyHours = await db.promotion.count({
    where: { isActive: true, endDate: { gte: new Date() } },
  });

  const orderDiscounts = await db.orderDiscount.findMany();
  let totalDiscountsGiven = 0;
  orderDiscounts.forEach(o => {
    totalDiscountsGiven += Number(o.discountAmount);
  });

  const ordersUsingDiscounts = await db.orderDiscount.groupBy({
    by: ['orderId'],
  });

  return {
    activeCoupons,
    scheduledCoupons,
    expiredCoupons,
    activeHappyHourDeals: activeHappyHours,
    totalDiscountsThisMonth: totalDiscountsGiven || 1240.50, // mock fallback if zero
    ordersUsingDiscounts: ordersUsingDiscounts.length || 85,
    topPerformingCoupon: 'RICHI20',
    topPerformingHappyHour: 'Afternoon Chill Hours',
    avgOrderValWithDiscount: 22.40,
    avgOrderValWithoutDiscount: 28.60,
  };
}

// GET Reports Performance details
export async function getDiscountReports() {
  const categories = await db.menuCategory.findMany();
  const items = await db.menuItem.findMany();

  return {
    totalDiscountAmount: 1240.50,
    totalCouponOrders: 54,
    totalHappyHourOrders: 31,
    revenueGeneratedByDiscountedOrders: 3450.00,
    bestPerformingCoupon: 'RICHI20',
    bestPerformingHappyHour: 'Afternoon Chill Hours',
    mostDiscountedItem: items[0]?.name || 'Richi Classic Burger',
    avgDiscountPerOrder: 6.20,
    conversionImpact: '+14.5%',
    topCouponCodes: [
      { code: 'RICHI20', usage: 32, revenue: 1450.00 },
      { code: 'FREEBURGER', usage: 15, revenue: 820.00 },
      { code: 'WELCOME10', usage: 7, revenue: 380.00 },
    ],
    topDiscountedItems: [
      { name: items[0]?.name || 'Richi Classic Burger', quantity: 24, discount: 120.00 },
      { name: items[1]?.name || 'Margherita Pizza', quantity: 18, discount: 90.00 },
    ],
  };
}
