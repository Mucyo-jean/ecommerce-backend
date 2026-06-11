import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { slugify } from '../../utils/slug';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

const sortMap: Record<ListParams['sort'], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  rating: { rating: 'desc' },
};

export async function listProducts(params: ListParams) {
  const { page, limit, search, categoryId, minPrice, maxPrice, sort } = params;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: sortMap[sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function assertCategoryExists(categoryId: string) {
  const exists = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!exists) throw ApiError.badRequest('categoryId does not reference an existing category');
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  currency?: string;
  isActive?: boolean;
}) {
  await assertCategoryExists(data.categoryId);
  return prisma.product.create({
    data: { ...data, slug: `${slugify(data.name)}-${Date.now().toString(36)}` },
    include: { category: true },
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    imageUrl: string;
    currency: string;
    isActive: boolean;
  }>,
) {
  await getProduct(id);
  if (data.categoryId) await assertCategoryExists(data.categoryId);
  return prisma.product.update({
    where: { id },
    data: { ...data, ...(data.name ? { slug: `${slugify(data.name)}-${Date.now().toString(36)}` } : {}) },
    include: { category: true },
  });
}

export async function deleteProduct(id: string) {
  await getProduct(id);
  // Soft delete to preserve order history integrity.
  await prisma.product.update({ where: { id }, data: { isActive: false } });
}
