import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

// Revenue counts only orders that have been paid.
const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export async function dashboard() {
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueAgg,
    statusGroups,
    paymentGroups,
    lowStock,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: PAID_STATUSES } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.payment.groupBy({ by: ['method'], _count: { method: true }, where: { status: PaymentStatus.SUCCESS } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ]);

  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);

  return {
    totals: {
      orders: totalOrders,
      customers: totalCustomers,
      activeProducts: totalProducts,
      revenue: totalRevenue,
      currency: 'RWF',
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    },
    ordersByStatus: statusGroups.map((g) => ({ status: g.status, count: g._count.status })),
    paymentsByMethod: paymentGroups.map((g) => ({ method: g.method, count: g._count.method })),
    lowStockProducts: lowStock,
  };
}

// Daily revenue + order count for the last N days (defaults to 14).
export async function salesTimeseries(days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { in: PAID_STATUSES } },
    select: { createdAt: true, totalAmount: true },
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += Number(o.totalAmount);
      bucket.orders += 1;
    }
  }

  return [...buckets.entries()].map(([date, v]) => ({ date, ...v }));
}

// Best-selling products by units sold.
export async function topProducts(limit = 10) {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  const ids = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  return grouped.map((g) => {
    const p = products.find((x) => x.id === g.productId);
    return {
      productId: g.productId,
      name: p?.name ?? 'Unknown',
      unitsSold: g._sum.quantity ?? 0,
      price: p ? Number(p.price) : 0,
    };
  });
}
