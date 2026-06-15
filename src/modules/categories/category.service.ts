import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { slugify } from '../../utils/slug';

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: { where: { isActive: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

export async function createCategory(data: { name: string; description?: string; imageUrl?: string }) {
  return prisma.category.create({
    data: { ...data, slug: slugify(data.name) },
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string; imageUrl?: string },
) {
  await getCategory(id);
  return prisma.category.update({
    where: { id },
    data: { ...data, ...(data.name ? { slug: slugify(data.name) } : {}) },
  });
}

export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw ApiError.conflict('Cannot delete a category that still has products');
  }
  await prisma.category.delete({ where: { id } });
}
