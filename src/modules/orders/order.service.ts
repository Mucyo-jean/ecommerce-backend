import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { charge } from '../payments/payment.gateway';

interface CheckoutInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `MATIC-${stamp}-${rand}`;
}

/**
 * Converts the user's cart into a confirmed order.
 * Runs inside a transaction so stock decrement, order creation and cart
 * clearing all succeed or all roll back together. Payment is attempted after
 * the order row exists and the result is persisted.
 */
export async function checkout(userId: string, input: CheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  // Validate stock up-front for a clear error message.
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw ApiError.badRequest(`"${item.product.name}" is no longer available`);
    }
    if (item.quantity > item.product.stock) {
      throw ApiError.badRequest(
        `Insufficient stock for "${item.product.name}" (requested ${item.quantity}, available ${item.product.stock})`,
      );
    }
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const orderNumber = generateOrderNumber();

  // 1) Create order + items + decrement stock + clear cart atomically.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        totalAmount: new Prisma.Decimal(totalAmount),
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        city: input.city,
        notes: input.notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
        payment: {
          create: {
            method: input.paymentMethod,
            status: PaymentStatus.PENDING,
            amount: new Prisma.Decimal(totalAmount),
          },
        },
      },
      include: { items: true, payment: true },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  // 2) Attempt payment (mock or real gateway) and persist result.
  const result = await charge({
    amount: totalAmount,
    currency: 'RWF',
    method: input.paymentMethod,
    phone: input.customerPhone,
    reference: orderNumber,
  });

  const paymentStatus =
    result.status === 'SUCCESS'
      ? PaymentStatus.SUCCESS
      : result.status === 'PENDING'
        ? PaymentStatus.PENDING
        : PaymentStatus.FAILED;

  const orderStatus =
    result.status === 'SUCCESS' ? OrderStatus.PAID : OrderStatus.PENDING;

  await prisma.$transaction([
    prisma.payment.update({
      where: { orderId: order.id },
      data: {
        status: paymentStatus,
        transactionId: result.transactionId,
        providerRef: result.providerRef,
      },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: orderStatus } }),
  ]);

  return getOrderById(order.id, userId, true);
}

export async function listMyOrders(
  userId: string,
  params: { page: number; limit: number; status?: OrderStatus },
) {
  const where: Prisma.OrderWhereInput = { userId, ...(params.status ? { status: params.status } : {}) };
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payment: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return {
    items,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) || 1 },
  };
}

export async function listAllOrders(params: { page: number; limit: number; status?: OrderStatus }) {
  const where: Prisma.OrderWhereInput = params.status ? { status: params.status } : {};
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payment: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return {
    items,
    pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) || 1 },
  };
}

export async function getOrderById(id: string, userId: string, isAdminOrOwner = false) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (!isAdminOrOwner && order.userId !== userId) {
    throw ApiError.forbidden('You cannot view this order');
  }
  return order;
}

export async function updateStatus(id: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw ApiError.notFound('Order not found');
  return prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true, payment: true },
  });
}
