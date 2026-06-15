import { prisma } from '../../lib/prisma';

/**
 * Recommendation engine (innovation feature).
 *
 * Combines three lightweight, explainable signals — no external ML service
 * required — to surface relevant products:
 *
 *  1. "Customers also viewed"  -> collaborative signal from ProductView
 *     co-occurrence (users who viewed X also viewed Y).
 *  2. "More from this category" -> content-based fallback.
 *  3. "Trending now"            -> popularity from recent views + sales.
 */

const TOP_N = 8;

// Products frequently viewed in the same sessions/users as the given product.
export async function alsoViewed(productId: string, limit = TOP_N) {
  // Find users who viewed this product...
  const viewers = await prisma.productView.findMany({
    where: { productId, userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
    take: 500,
  });
  const userIds = viewers.map((v) => v.userId!).filter(Boolean);

  if (userIds.length === 0) return relatedByCategory(productId, limit);

  // ...and the other products those users viewed, ranked by frequency.
  const grouped = await prisma.productView.groupBy({
    by: ['productId'],
    where: { userId: { in: userIds }, productId: { not: productId } },
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: limit,
  });

  const ids = grouped.map((g) => g.productId);
  if (ids.length === 0) return relatedByCategory(productId, limit);

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  // Preserve the frequency ordering.
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

// Content-based: other active products in the same category.
export async function relatedByCategory(productId: string, limit = TOP_N) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return [];
  return prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, id: { not: productId } },
    orderBy: { rating: 'desc' },
    take: limit,
  });
}

// Popularity-based trending list over the last 30 days.
export async function trending(limit = TOP_N) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const viewAgg = await prisma.productView.groupBy({
    by: ['productId'],
    where: { createdAt: { gte: since } },
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: limit * 2,
  });

  const saleAgg = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit * 2,
  });

  // Weighted score: a purchase counts 3x a view.
  const score = new Map<string, number>();
  for (const v of viewAgg) score.set(v.productId, (score.get(v.productId) ?? 0) + v._count.productId);
  for (const s of saleAgg)
    score.set(s.productId, (score.get(s.productId) ?? 0) + (s._sum.quantity ?? 0) * 3);

  const rankedIds = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, limit);

  if (rankedIds.length === 0) {
    // Cold start: newest active products.
    return prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: limit });
  }

  const products = await prisma.product.findMany({ where: { id: { in: rankedIds }, isActive: true } });
  return rankedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

// Personalized "for you" feed based on the categories a user has viewed.
export async function forYou(userId: string, limit = TOP_N) {
  const recentViews = await prisma.productView.findMany({
    where: { userId },
    include: { product: { select: { categoryId: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const categoryIds = [...new Set(recentViews.map((v) => v.product.categoryId))];
  if (categoryIds.length === 0) return trending(limit);

  return prisma.product.findMany({
    where: { categoryId: { in: categoryIds }, isActive: true },
    orderBy: { rating: 'desc' },
    take: limit,
  });
}
