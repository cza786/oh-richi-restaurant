import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PASSWORD_HASH = '$2b$10$PTkEwlYzc3hQutWaDYvpcOXz28y/4HaBXN/MGZwM8Ci464T3pBwpS'; // password123

async function main() {
  console.log('Starting seeding database...');

  // 1. Seed Roles
  const rolesData = [
    { name: 'OWNER', description: 'Restaurant owner with full access to their restaurant settings, menu, staff, and analytics.' },
    { name: 'ADMIN', description: 'System administrator with global settings access, database management, and system configuration.' },
    { name: 'MANAGER', description: 'Restaurant manager responsible for daily operations, menu adjustments, and staff management.' },
    { name: 'KITCHEN_STAFF', description: 'Kitchen staff with access to order preparation queue and menu item availability.' },
    { name: 'CASHIER', description: 'Cashier with access to order management, payment processing, and table status.' },
    { name: 'CUSTOMER', description: 'Registered customers who place orders online.' },
  ];

  const roles: Record<string, any> = {};
  for (const role of rolesData) {
    roles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`Seeded ${Object.keys(roles).length} roles.`);

  // 2. Seed Permissions
  const permissionsData = [
    { name: 'manage:system', description: 'Global system configuration and administration' },
    { name: 'manage:restaurant', description: 'Configure restaurant entity settings' },
    { name: 'manage:users', description: 'Create, update and delete staff users' },
    { name: 'manage:menu', description: 'Manage menu categories, items, addons, variations' },
    { name: 'manage:orders', description: 'Update order status and assign delivery/tables' },
    { name: 'read:orders', description: 'View current and past orders' },
    { name: 'view:reports', description: 'View sales, performance, and automation reports' },
    { name: 'manage:settings', description: 'Configure delivery settings, tables and locations' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`Seeded ${Object.keys(permissions).length} permissions.`);

  // 3. Link Roles and Permissions (RolePermission)
  const rolePermissionsMap: Record<string, string[]> = {
    ADMIN: ['manage:system', 'manage:users', 'view:reports'],
    OWNER: ['manage:restaurant', 'manage:users', 'manage:menu', 'manage:orders', 'read:orders', 'view:reports', 'manage:settings'],
    MANAGER: ['manage:users', 'manage:menu', 'manage:orders', 'read:orders', 'view:reports', 'manage:settings'],
    KITCHEN_STAFF: ['read:orders', 'manage:orders'],
    CASHIER: ['read:orders', 'manage:orders'],
    CUSTOMER: ['read:orders'],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
    const roleId = roles[roleName].id;
    for (const permName of permNames) {
      const permissionId = permissions[permName].id;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }
  console.log('Role permissions links created.');

  // 4. Seed Users
  const usersData = [
    { email: 'admin@ohrichi.com', firstName: 'System', lastName: 'Admin', roleName: 'ADMIN' },
    { email: 'owner@ohrichi.com', firstName: 'Richi', lastName: 'Owner', roleName: 'OWNER' },
    { email: 'manager@ohrichi.com', firstName: 'John', lastName: 'Manager', roleName: 'MANAGER' },
    { email: 'kitchen@ohrichi.com', firstName: 'Mario', lastName: 'Chef', roleName: 'KITCHEN_STAFF' },
    { email: 'cashier@ohrichi.com', firstName: 'Sarah', lastName: 'Cashier', roleName: 'CASHIER' },
  ];

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { passwordHash: DEMO_PASSWORD_HASH },
      create: {
        email: userData.email,
        passwordHash: DEMO_PASSWORD_HASH,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: '+390123456789',
        isActive: true,
      },
    });

    const roleId = roles[userData.roleName].id;
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
      },
    });
  }
  console.log('Users and user roles seeded.');

  // 5. Seed Restaurant: "Oh Richi"
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d1' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d1',
      name: 'Oh Richi',
      description: 'Authentic Italian & Specialty Gourmet Burgers and Pizzas',
      website: 'https://ohrichi.com',
      logoUrl: 'https://ohrichi.com/logo.png',
      isActive: true,
    },
  });
  console.log(`Seeded restaurant: ${restaurant.name}`);

  // 6. Seed Location: "Main Branch"
  const location = await prisma.restaurantLocation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d2' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d2',
      restaurantId: restaurant.id,
      name: 'Main Branch',
      addressLine1: '123 Via Roma',
      city: 'Rome',
      state: 'RM',
      postalCode: '00100',
      country: 'Italy',
      phone: '+39061234567',
      email: 'main@ohrichi.com',
      latitude: 41.9028,
      longitude: 12.4964,
      isActive: true,
    },
  });
  console.log(`Seeded location: ${location.name}`);

  // 7. Seed Delivery Settings: 6km radius, €20 minimum order, €0.50 per km
  await prisma.deliverySettings.upsert({
    where: { locationId: location.id },
    update: {
      deliveryRadius: 6.0,
      minimumOrderAmount: 20.00,
      baseDeliveryFee: 3.00,
      feePerKm: 0.50,
    },
    create: {
      locationId: location.id,
      deliveryRadius: 6.0,
      minimumOrderAmount: 20.00,
      baseDeliveryFee: 3.00,
      feePerKm: 0.50,
    },
  });
  console.log('Seeded delivery settings.');

  // 8. Seed Delivery Zones (e.g. Central Zone)
  await prisma.deliveryZone.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d3' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d3',
      locationId: location.id,
      name: 'Central Zone',
      postalCode: '00100',
      deliveryFee: 3.50,
      minimumOrder: 20.00,
    },
  });
  console.log('Seeded delivery zones.');

  // 9. Seed Restaurant Tables (e.g. Tables T1 to T5)
  for (let i = 1; i <= 5; i++) {
    await prisma.restaurantTable.upsert({
      where: { id: `d3b07384-d113-4e4e-862d-0b32525164e${i}` },
      update: {},
      create: {
        id: `d3b07384-d113-4e4e-862d-0b32525164e${i}`,
        locationId: location.id,
        tableNumber: `T${i}`,
        seatingCapacity: i % 2 === 0 ? 4 : 2,
        status: 'AVAILABLE',
      },
    });
  }
  console.log('Seeded restaurant tables.');

  // 10. Seed Spice Levels
  const spiceLevelsData = [
    { id: 'd3b07384-d113-4e4e-862d-0b32525164f0', name: 'Mild', value: 0, priceDifference: 0 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164f1', name: 'Medium', value: 1, priceDifference: 0 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164f2', name: 'Hot', value: 2, priceDifference: 0 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164f3', name: 'Extra Hot', value: 3, priceDifference: 0.50 },
  ];

  const spiceLevels: Record<string, any> = {};
  for (const spice of spiceLevelsData) {
    spiceLevels[spice.name] = await prisma.spiceLevel.upsert({
      where: { id: spice.id },
      update: {},
      create: spice,
    });
  }
  console.log('Seeded spice levels.');

  // 11. Seed Addons
  const addonsData = [
    { id: 'd3b07384-d113-4e4e-862d-0b32525164c0', name: 'Extra Cheese', price: 1.50 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164c1', name: 'Crispy Bacon', price: 2.00 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164c2', name: 'Jalapenos', price: 1.00 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164c3', name: 'Avocado', price: 2.50 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164c4', name: 'Grilled Mushrooms', price: 1.50 },
  ];

  const addons: Record<string, any> = {};
  for (const addon of addonsData) {
    addons[addon.name] = await prisma.addon.upsert({
      where: { id: addon.id },
      update: {},
      create: addon,
    });
  }
  console.log('Seeded basic addons.');

  // 12. Seed Menu Categories: Burgers, Pizzas, Drinks, Desserts
  const categoriesData = [
    { id: 'd3b07384-d113-4e4e-862d-0b32525164a0', name: 'Burgers', sortOrder: 1 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164a1', name: 'Pizzas', sortOrder: 2 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164a2', name: 'Drinks', sortOrder: 3 },
    { id: 'd3b07384-d113-4e4e-862d-0b32525164a3', name: 'Desserts', sortOrder: 4 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.name] = await prisma.menuCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        locationId: location.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }
  console.log('Seeded menu categories.');

  // 13. Seed Menu Items & Variations & Addons links
  // Burgers - Richi Classic Burger
  const richiBurger = await prisma.menuItem.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164b0' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164b0',
      categoryId: categories['Burgers'].id,
      name: 'Richi Classic Burger',
      description: 'Flame-grilled Angus beef patty with fresh lettuce, tomato, onions, and Richi signature sauce.',
      basePrice: 12.50,
      isAvailable: true,
    },
  });

  // Variations for Richi Classic Burger
  await prisma.itemVariation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d5' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d5',
      itemId: richiBurger.id,
      name: 'Single Patty',
      priceDifference: 0,
      sku: 'RBUR-SNGL',
    },
  });
  await prisma.itemVariation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d6' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d6',
      itemId: richiBurger.id,
      name: 'Double Patty',
      priceDifference: 4.00,
      sku: 'RBUR-DBL',
    },
  });

  // Connect Burger with Addons (Extra Cheese, Crispy Bacon, Jalapenos)
  for (const addonName of ['Extra Cheese', 'Crispy Bacon', 'Jalapenos']) {
    const addonId = addons[addonName].id;
    await prisma.itemAddon.upsert({
      where: {
        itemId_addonId: { itemId: richiBurger.id, addonId },
      },
      update: {},
      create: {
        itemId: richiBurger.id,
        addonId,
        isRequired: false,
        maxLimit: 3,
      },
    });
  }

  // Connect Burger with Spice Levels (Mild, Medium, Hot, Extra Hot)
  for (const spiceName of ['Mild', 'Medium', 'Hot', 'Extra Hot']) {
    const spiceLevelId = spiceLevels[spiceName].id;
    await prisma.itemSpiceLevel.upsert({
      where: {
        itemId_spiceLevelId: { itemId: richiBurger.id, spiceLevelId },
      },
      update: {},
      create: {
        itemId: richiBurger.id,
        spiceLevelId,
      },
    });
  }

  // Pizzas - Margherita Pizza
  const margherita = await prisma.menuItem.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164b1' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164b1',
      categoryId: categories['Pizzas'].id,
      name: 'Margherita Pizza',
      description: 'San Marzano tomatoes, fresh mozzarella, fresh basil, and extra virgin olive oil.',
      basePrice: 10.00,
      isAvailable: true,
    },
  });

  // Variations for Margherita Pizza (Standard, Family Size)
  await prisma.itemVariation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d7' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d7',
      itemId: margherita.id,
      name: 'Standard (32cm)',
      priceDifference: 0,
      sku: 'PZMAR-STD',
    },
  });
  await prisma.itemVariation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d8' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d8',
      itemId: margherita.id,
      name: 'Family (50cm)',
      priceDifference: 6.50,
      sku: 'PZMAR-FAM',
    },
  });

  // Connect Margherita with Addons
  for (const addonName of ['Extra Cheese', 'Grilled Mushrooms']) {
    const addonId = addons[addonName].id;
    await prisma.itemAddon.upsert({
      where: {
        itemId_addonId: { itemId: margherita.id, addonId },
      },
      update: {},
      create: {
        itemId: margherita.id,
        addonId,
        isRequired: false,
        maxLimit: 2,
      },
    });
  }

  // Drinks - Coca Cola, Still Water
  const coke = await prisma.menuItem.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164b2' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164b2',
      categoryId: categories['Drinks'].id,
      name: 'Coca Cola',
      description: 'Refreshing cold soft drink.',
      basePrice: 2.50,
      isAvailable: true,
    },
  });

  const water = await prisma.menuItem.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164b3' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164b3',
      categoryId: categories['Drinks'].id,
      name: 'Still Water',
      description: 'Acqua Panna still mineral water.',
      basePrice: 2.00,
      isAvailable: true,
    },
  });

  // Combo Item - Super Richi Combo Meal
  const comboItem = await prisma.menuItem.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164b4' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164b4',
      categoryId: categories['Burgers'].id,
      name: 'Super Richi Combo Meal',
      description: 'A complete meal containing a Classic Burger and a choice of cold drink.',
      basePrice: 14.00,
      isAvailable: true,
    },
  });

  // Combo Group for drink choice
  const drinkChoiceGroup = await prisma.comboGroup.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164c9' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164c9',
      name: 'Select Your Drink',
      minSelection: 1,
      maxSelection: 1,
    },
  });

  // Associate combo item with group
  await prisma.itemComboGroup.upsert({
    where: {
      itemId_comboGroupId: { itemId: comboItem.id, comboGroupId: drinkChoiceGroup.id },
    },
    update: {},
    create: {
      itemId: comboItem.id,
      comboGroupId: drinkChoiceGroup.id,
    },
  });

  // Add choices to the combo group
  await prisma.comboChoice.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164d9' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164d9',
      comboGroupId: drinkChoiceGroup.id,
      itemId: coke.id,
      additionalPrice: 0.00,
    },
  });

  await prisma.comboChoice.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164da' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164da',
      comboGroupId: drinkChoiceGroup.id,
      itemId: water.id,
      additionalPrice: -0.50,
    },
  });

  console.log('Seeded menu items, variations, addons links, spice levels, and combo configurations.');

  // 14. Seed Pricing Groups
  const happyHour = await prisma.pricingGroup.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164db' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164db',
      restaurantId: restaurant.id,
      name: 'Happy Hour Special',
      description: 'Discounted menu pricing for afternoon orders.',
      discountPercentage: 15.00,
      isActive: true,
    },
  });

  await prisma.pricingOption.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164dc' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164dc',
      pricingGroupId: happyHour.id,
      itemId: margherita.id,
      price: 8.00,
    },
  });
  console.log('Seeded pricing groups and options.');

  // 15. Seed Report Automation
  await prisma.reportAutomation.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164dd' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164dd',
      restaurantId: restaurant.id,
      name: 'Daily Sales Report',
      reportType: 'SALES',
      frequency: 'DAILY',
      recipientEmails: 'owner@ohrichi.com,manager@ohrichi.com',
      cronExpression: '0 23 * * *',
      isActive: true,
    },
  });
  console.log('Seeded report automation details.');

  // 16. Seed Loyalty Rules
  await prisma.loyaltyRule.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164e0' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164e0',
      restaurantId: restaurant.id,
      pointsPerEuro: 1.0,
      minimumOrderAmount: 5.00,
      maximumPointsPerOrder: 500,
      pointsActivationMode: 'INSTANT',
      pendingActivationHours: 0,
      expiryEnabled: false,
      earnOnDineIn: true,
      earnOnTakeAway: true,
      earnOnDelivery: true,
      isActive: true,
    },
  });
  console.log('Seeded default loyalty rules.');

  // 17. Seed Catalog Rewards
  const rewardsData = [
    {
      id: 'd3b07384-d113-4e4e-862d-0b32525164f0',
      restaurantId: restaurant.id,
      name: 'Free Soft Drink',
      description: 'Redeem for a refreshing cold Coca Cola.',
      requiredPoints: 300,
      rewardType: 'FREE_ITEM',
      menuItemId: 'd3b07384-d113-4e4e-862d-0b32525164b2', // Coke
      discountAmount: 2.50,
      dineInAllowed: true,
      takeAwayAllowed: true,
      deliveryAllowed: true,
      isActive: true,
    },
    {
      id: 'd3b07384-d113-4e4e-862d-0b32525164f1',
      restaurantId: restaurant.id,
      name: 'Free Oh G Classic Burger',
      description: 'Redeem for our signature flame-grilled burger.',
      requiredPoints: 750,
      rewardType: 'FREE_ITEM',
      menuItemId: 'd3b07384-d113-4e4e-862d-0b32525164b0', // Richi Classic Burger
      discountAmount: 12.50,
      dineInAllowed: true,
      takeAwayAllowed: true,
      deliveryAllowed: true,
      isActive: true,
    },
    {
      id: 'd3b07384-d113-4e4e-862d-0b32525164f2',
      restaurantId: restaurant.id,
      name: '€10 Off Order',
      description: 'Save €10.00 on any dine-in or takeaway order.',
      requiredPoints: 500,
      rewardType: 'FIXED_DISCOUNT',
      discountAmount: 10.00,
      dineInAllowed: true,
      takeAwayAllowed: true,
      deliveryAllowed: true,
      isActive: true,
    },
  ];

  for (const reward of rewardsData) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      update: {},
      create: reward,
    });
  }
  console.log('Seeded loyalty rewards catalog.');

  // 18. Seed Discount Settings
  await prisma.discountSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      enableCoupons: true,
      enableHappyHour: true,
      allowOneCouponPerOrder: true,
      allowCouponHappyHourTogether: false,
      allowCouponRewardsTogether: false,
      allowHappyHourRewardsTogether: false,
      requireManagerApprovalManual: true,
      defaultCouponDurationDays: 30,
      defaultHappyHourTimezone: 'UTC',
      autoExpireOldCoupons: true,
      autoPauseExpiredPromotions: true,
      maxTotalDiscountPercentage: 50.00,
      preventFinalTotalBelowZero: true,
      requireApprovalThresholdAmount: 50.00,
      requireApprovalThresholdPercent: 30.00,
      showReportsToManager: true,
      showReportsToCashier: false,
    },
  });
  console.log('Seeded discount settings config.');

  // 19. Seed Coupons
  await prisma.coupon.upsert({
    where: { code: 'RICHI20' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164a1',
      restaurantId: restaurant.id,
      code: 'RICHI20',
      name: '20% Special Discount',
      description: 'Get 20% off on your meals!',
      discountType: 'percentage_discount',
      discountValue: 20.00,
      minimumOrderAmount: 15.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      dineInAllowed: true,
      takeAwayAllowed: true,
      guestAllowed: true,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FREEBURGER' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164a2',
      restaurantId: restaurant.id,
      code: 'FREEBURGER',
      name: 'Free Classic Burger',
      description: 'Free Richi Classic Burger on orders over €25.',
      discountType: 'free_item',
      discountValue: 12.50,
      freeMenuItemId: 'd3b07384-d113-4e4e-862d-0b32525164b0',
      minimumOrderAmount: 25.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      dineInAllowed: true,
      takeAwayAllowed: true,
      guestAllowed: true,
      isActive: true,
    },
  });
  console.log('Seeded default coupon codes.');

  // 20. Seed Happy-Hour Promotion
  await prisma.promotion.upsert({
    where: { id: 'd3b07384-d113-4e4e-862d-0b32525164a3' },
    update: {},
    create: {
      id: 'd3b07384-d113-4e4e-862d-0b32525164a3',
      restaurantId: restaurant.id,
      name: 'Afternoon Chill Hours',
      description: 'Enjoy 15% off during chill afternoons.',
      promotionType: 'HAPPY_HOUR',
      discountType: 'percentage_discount',
      discountValue: 15.00,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-12-31'),
      startTime: '15:00',
      endTime: '18:00',
      timezone: 'UTC',
      daysOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
      dineInAllowed: true,
      takeAwayAllowed: true,
      appliesTo: 'ALL',
      priority: 1,
      isActive: true,
    },
  });
  console.log('Seeded Happy-Hour Afternoon Chill promo.');

  // 21. Seed Initial Demo Orders & Payments
  const demoLocation = await prisma.restaurantLocation.findFirst();
  const burger = await prisma.menuItem.findFirst({ where: { name: 'Richi Classic Burger' } });
  const pizza = await prisma.menuItem.findFirst({ where: { name: 'Margherita Pizza' } });
  const demoWater = await prisma.menuItem.findFirst({ where: { name: 'Still Water' } });
  const table1 = await prisma.restaurantTable.findFirst({ where: { tableNumber: 'T1' } });
  const table2 = await prisma.restaurantTable.findFirst({ where: { tableNumber: 'T2' } });

  if (demoLocation && burger && pizza) {
    const order1 = await prisma.order.upsert({
      where: { shortId: 'OR-9204' },
      update: {},
      create: {
        shortId: 'OR-9204',
        locationId: demoLocation.id,
        customerName: 'David Miller',
        orderType: 'TAKEAWAY',
        status: 'PENDING',
        subtotal: 14.50,
        totalAmount: 14.50,
        paymentStatus: 'PAID',
        orderItems: {
          create: [
            { itemId: burger.id, quantity: 1, unitPrice: 12.50, subtotal: 12.50 },
            { itemId: demoWater ? demoWater.id : burger.id, quantity: 1, unitPrice: 2.00, subtotal: 2.00 },
          ],
        },
      },
    });

    const order2 = await prisma.order.upsert({
      where: { shortId: 'OR-9202' },
      update: {},
      create: {
        shortId: 'OR-9202',
        locationId: demoLocation.id,
        customerName: 'Marco Rossi',
        orderType: 'DINE_IN',
        status: 'PREPARING',
        tableId: table1 ? table1.id : undefined,
        subtotal: 18.20,
        totalAmount: 18.20,
        paymentStatus: 'PENDING',
        orderItems: {
          create: [
            { itemId: burger.id, quantity: 1, unitPrice: 12.50, subtotal: 12.50 },
            { itemId: pizza.id, quantity: 1, unitPrice: 10.00, subtotal: 10.00 },
          ],
        },
      },
    });

    const order3 = await prisma.order.upsert({
      where: { shortId: 'OR-9200' },
      update: {},
      create: {
        shortId: 'OR-9200',
        locationId: demoLocation.id,
        customerName: 'Ahmed Khan',
        orderType: 'DELIVERY',
        status: 'READY',
        subtotal: 23.80,
        deliveryFee: 3.50,
        totalAmount: 27.30,
        paymentStatus: 'PAID',
        deliveryAddress: 'Via Nazionale 45, Rome',
        orderItems: {
          create: [
            { itemId: pizza.id, quantity: 2, unitPrice: 10.00, subtotal: 20.00 },
          ],
        },
      },
    });

    const order4 = await prisma.order.upsert({
      where: { shortId: 'OR-9199' },
      update: {},
      create: {
        shortId: 'OR-9199',
        locationId: demoLocation.id,
        customerName: 'Emma Watson',
        orderType: 'DINE_IN',
        status: 'COMPLETED',
        tableId: table2 ? table2.id : undefined,
        subtotal: 28.50,
        totalAmount: 28.50,
        paymentStatus: 'PAID',
        orderItems: {
          create: [
            { itemId: burger.id, quantity: 2, unitPrice: 12.50, subtotal: 25.00 },
          ],
        },
      },
    });

    const paidOrders = [order1, order3, order4];
    for (const ord of paidOrders) {
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId: ord.id },
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            orderId: ord.id,
            paymentMethod: ord.orderType === 'DELIVERY' ? 'CARD ON DELIVERY' : 'CARD AT COUNTER',
            amount: ord.totalAmount,
            status: 'SUCCESSFUL',
            transactionReference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        });
      }
    }
    console.log('Seeded initial demo orders and payment transactions.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
