import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Real, relevant photos served from the Unsplash CDN (stable, fast, free to hot-link).
// Each URL is cropped to a square so it fits the frontend's aspect-square cards.
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;

const categories = [
  { name: 'Electronics', description: 'Phones, laptops and accessories', imageUrl: img('photo-1498049794561-7780e7231661') },
  { name: 'Fashion', description: 'Clothing, shoes and accessories', imageUrl: img('photo-1445205170230-053b83016050') },
  { name: 'Home & Kitchen', description: 'Appliances and household essentials', imageUrl: img('photo-1556911220-bff31c812dba') },
  { name: 'Groceries', description: 'Everyday food and supplies', imageUrl: img('photo-1542838132-92c53300491e') },
  { name: 'Handicrafts', description: 'Authentic Rwandan handmade products', imageUrl: img('photo-1528459801416-a9e53bbf4e17') },
];

// product name -> [categoryName, price(RWF), stock, description, imageUrl]
const products: Record<string, [string, number, number, string, string]> = {
  'Samsung Galaxy A15': ['Electronics', 189999, 30, '6.5" display, 128GB storage, 5000mAh battery', img('photo-1511707171634-5f897ff02aa9')],
  'HP Pavilion 15 Laptop': ['Electronics', 749999, 12, 'Intel Core i5, 8GB RAM, 512GB SSD', img('photo-1496181133206-80ce9b88a853')],
  'Wireless Earbuds Pro': ['Electronics', 34999, 80, 'Bluetooth 5.3 with active noise cancellation', img('photo-1606220588913-b3aacb4d2f46')],
  'Anker Power Bank 20000mAh': ['Electronics', 29999, 50, 'Fast-charging dual USB power bank', img('photo-1609091839311-d5365f9ff1c5')],
  "Men's Casual Sneakers": ['Fashion', 24999, 40, 'Comfortable everyday sneakers, sizes 39-45', img('photo-1542291026-7eec264c27ff')],
  'Kitenge Print Dress': ['Fashion', 18999, 25, 'Vibrant African print dress, locally tailored', img('photo-1539008835657-9e8e9680c956')],
  'Leather Wallet': ['Fashion', 9999, 60, 'Genuine leather bifold wallet', img('photo-1627123424574-724758594e93')],
  'Electric Kettle 1.8L': ['Home & Kitchen', 15999, 35, 'Stainless steel fast-boil kettle', img('photo-1594213114663-d94db9b17125')],
  'Non-stick Cookware Set': ['Home & Kitchen', 45999, 20, '5-piece non-stick pots and pans set', img('photo-1556911073-38141963c9e0')],
  'Blender 2L': ['Home & Kitchen', 27999, 18, 'Powerful 600W kitchen blender', img('photo-1570222094114-d054a817e56b')],
  'Rwandan Coffee 1kg': ['Groceries', 8999, 100, 'Premium roasted Arabica from Huye', img('photo-1447933601403-0c6688de566e')],
  'Akabanga Chili Oil': ['Groceries', 2999, 200, 'Famous Rwandan hot chili oil', img('photo-1583454110551-21f2fa2afe61')],
  'Agaseke Woven Basket': ['Handicrafts', 12999, 30, 'Traditional peace basket, handwoven', img('photo-1610701596007-11502861dcfa')],
  'Imigongo Art Panel': ['Handicrafts', 34999, 10, 'Geometric cow-dung art from Eastern Province', img('photo-1578321272176-b7bbc0679853')],
  'Handmade Beaded Necklace': ['Handicrafts', 6999, 45, 'Colourful handcrafted beaded jewellery', img('photo-1515562141207-7a88fb7ce338')],
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
      update: { description: c.description, imageUrl: c.imageUrl },
      create: { name: c.name, slug: slugify(c.name), description: c.description, imageUrl: c.imageUrl },
    });
    categoryMap.set(c.name, cat.id);
  }
  console.log(`📂 ${categories.length} categories seeded`);

  // 4) Products
  let count = 0;
  for (const [name, [categoryName, price, stock, description, imageUrl]] of Object.entries(products)) {
    const categoryId = categoryMap.get(categoryName)!;
    await prisma.product.upsert({
      where: { slug: slugify(name) },
      update: { price, stock, description, imageUrl },
      create: {
        name,
        slug: slugify(name),
        description,
        price,
        stock,
        categoryId,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        imageUrl,
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
