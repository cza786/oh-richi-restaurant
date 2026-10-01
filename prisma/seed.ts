import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@door2door.local' },
    update: { role: 'SUPER_ADMIN', isActive: true },
    create: {
      id: 'user-super-admin',
      email: 'admin@door2door.local',
      passwordHash,
      firstName: 'Door2Door',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'oh-richi' },
    update: {},
    create: {
      id: 'restaurant-oh-richi',
      slug: 'oh-richi',
      name: 'Oh Richi',
      description: 'Fresh burgers available for guest delivery checkout.',
      logoUrl: '/door2door_logo.jpg',
      coverImageUrl: '/burger_hero.png',
      address: '123 Main Street, Karachi 74000, Pakistan',
      phone: '+92 300 0000000',
      whatsapp: '+92 300 0000000',
      isActive: true,
      isOpen: true,
      openingTime: '10:00',
      closingTime: '23:00',
      deliveryRadiusKm: 10,
      minimumOrderAmount: 10,
      deliveryFee: 3,
    },
  });

  const categories = [
    { id: 'category-burgers', name: 'Burgers', imageUrl: '/burger_hero.png', sortOrder: 1 },
    { id: 'category-sides', name: 'Sides', imageUrl: '/burger_hero.png', sortOrder: 2 },
    { id: 'category-drinks', name: 'Drinks', imageUrl: '/burger_hero.png', sortOrder: 3 },
  ];
  for (const category of categories) {
    await prisma.menuCategory.upsert({
      where: { id: category.id },
      update: category,
      create: { ...category, restaurantId: restaurant.id, isActive: true },
    });
  }

  const products = [
    { id: 'product-classic-burger', categoryId: 'category-burgers', name: 'Classic Burger', description: 'Beef patty, cheese and house sauce.', basePrice: 8.5, imageUrl: '/burger_hero.png', sortOrder: 1 },
    { id: 'product-fries', categoryId: 'category-sides', name: 'French Fries', description: 'Crispy golden fries.', basePrice: 3.5, imageUrl: '/burger_hero.png', sortOrder: 1 },
    { id: 'product-cola', categoryId: 'category-drinks', name: 'Cola', description: 'Chilled soft drink.', basePrice: 2, imageUrl: '/burger_hero.png', sortOrder: 1 },
  ];
  for (const product of products) {
    await prisma.menuItem.upsert({
      where: { id: product.id },
      update: product,
      create: { ...product, restaurantId: restaurant.id, isActive: true, isAvailable: true },
    });
    await prisma.productImage.upsert({
      where: { id: `image-${product.id}` },
      update: { imageUrl: product.imageUrl, isPrimary: true },
      create: { id: `image-${product.id}`, productId: product.id, imageUrl: product.imageUrl, isPrimary: true },
    });
  }

  await prisma.productOption.upsert({
    where: { id: 'option-burger-size' },
    update: { name: 'Size', isRequired: true, sortOrder: 1 },
    create: { id: 'option-burger-size', productId: 'product-classic-burger', name: 'Size', isRequired: true, sortOrder: 1 },
  });
  for (const item of [
    { id: 'option-size-regular', name: 'Regular', priceDelta: 0, sortOrder: 1 },
    { id: 'option-size-large', name: 'Large', priceDelta: 2, sortOrder: 2 },
  ]) {
    await prisma.optionItem.upsert({
      where: { id: item.id },
      update: item,
      create: { ...item, optionId: 'option-burger-size', isActive: true },
    });
  }

  await prisma.setting.upsert({
    where: { key: 'platform_name' },
    update: { value: 'Door2Door' },
    create: { key: 'platform_name', value: 'Door2Door', description: 'Public platform name.' },
  });

  console.log('Seeded the Door2Door ERD-aligned MVP data.');
  console.log('Super Admin: admin@door2door.local');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
