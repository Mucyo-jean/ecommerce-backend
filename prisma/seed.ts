import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const categories = [
  { name: 'Electronics', description: 'Phones, laptops and accessories' },
  { name: 'Fashion', description: 'Clothing, shoes and accessories' },
  { name: 'Home & Kitchen', description: 'Appliances and household essentials' },
  { name: 'Groceries', description: 'Everyday food and supplies' },
  { name: 'Handicrafts', description: 'Authentic Rwandan handmade products' },
];

// product name -> [categoryName, price(RWF), stock, description]
const products: Record<string, [string, number, number, string]> = {
  'Samsung Galaxy A15': ['Electronics', 189999, 30, '6.5" display, 128GB storage, 5000mAh battery'],
  'HP Pavilion 15 Laptop': ['Electronics', 749999, 12, 'Intel Core i5, 8GB RAM, 512GB SSD'],
  'Wireless Earbuds Pro': ['Electronics', 34999, 80, 'Bluetooth 5.3 with active noise cancellation'],
  'Anker Power Bank 20000mAh': ['Electronics', 29999, 50, 'Fast-charging dual USB power bank'],
  "Men's Casual Sneakers": ['Fashion', 24999, 40, 'Comfortable everyday sneakers, sizes 39-45'],
  'Kitenge Print Dress': ['Fashion', 18999, 25, 'Vibrant African print dress, locally tailored'],
  'Leather Wallet': ['Fashion', 9999, 60, 'Genuine leather bifold wallet'],
  'Electric Kettle 1.8L': ['Home & Kitchen', 15999, 35, 'Stainless steel fast-boil kettle'],
  'Non-stick Cookware Set': ['Home & Kitchen', 45999, 20, '5-piece non-stick pots and pans set'],
  'Blender 2L': ['Home & Kitchen', 27999, 18, 'Powerful 600W kitchen blender'],
  'Rwandan Coffee 1kg': ['Groceries', 8999, 100, 'Premium roasted Arabica from Huye'],
  'Akabanga Chili Oil': ['Groceries', 2999, 200, 'Famous Rwandan hot chili oil'],
  'Agaseke Woven Basket': ['Handicrafts', 12999, 30, 'Traditional peace basket, handwoven'],
  'Imigongo Art Panel': ['Handicrafts', 34999, 10, 'Geometric cow-dung art from Eastern Province'],
  'Handmade Beaded Necklace': ['Handicrafts', 6999, 45, 'Colourful handcrafted beaded jewellery'],
};

async function main() {
  console.log('🌱 Seeding database...');

  // 1) Admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@matic.rw';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: process.env.ADMIN_NAME ?? 'Matic Administrator',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: Role.ADMIN,
      cart: { create: {} },
    },
  });
  console.log(`👤 Admin ready: ${adminEmail} / ${adminPassword}`);

  // 2) Demo customer
  const customerEmail = 'customer@matic.rw';
  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: 'Aline Uwase',
      email: customerEmail,
      password: await bcrypt.hash('Customer@123', 10),
      role: Role.CUSTOMER,
      phone: '+250788000000',
      cart: { create: {} },
    },
  });
  console.log(`👤 Customer ready: ${customerEmail} / Customer@123`);

  // 3) Categories
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: { description: c.description },
      create: { name: c.name, slug: slugify(c.name), description: c.description },
    });
    categoryMap.set(c.name, cat.id);
  }
  console.log(`📂 ${categories.length} categories seeded`);

  // 4) Products
  let count = 0;
  for (const [name, [categoryName, price, stock, description]] of Object.entries(products)) {
    const categoryId = categoryMap.get(categoryName)!;
    await prisma.product.upsert({
      where: { slug: slugify(name) },
      update: { price, stock, description },
      create: {
        name,
        slug: slugify(name),
        description,
        price,
        stock,
        categoryId,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        imageUrl: `https://placehold.co/600x400?text=${encodeURIComponent(name)}`,
      },
    });
    count++;
  }
  console.log(`📦 ${count} products seeded`);

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
