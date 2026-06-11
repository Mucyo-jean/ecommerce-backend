import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';

// Ensures the user has a cart row and returns its id.
async function getOrCreateCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return cart;
}

// Builds a cart response including line totals and a grand total.
async function buildCart(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { category: { select: { name: true } } } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) {
    return { items: [], subtotal: 0, totalItems: 0, currency: 'RWF' };
  }

  const items = cart.items.map((item) => {
    const price = Number(item.product.price);
    return {
      productId: item.productId,
      name: item.product.name,
      imageUrl: item.product.imageUrl,
      unitPrice: price,
      quantity: item.quantity,
      lineTotal: price * item.quantity,
      stock: item.product.stock,
      category: item.product.category?.name,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return { cartId: cart.id, items, subtotal, totalItems, currency: 'RWF' };
}

export async function getCart(userId: string) {
  return buildCart(userId);
}

export async function addItem(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} unit(s) of "${product.name}" are in stock`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: newQty },
    create: { cartId: cart.id, productId, quantity },
  });

  return buildCart(userId);
}

export async function updateItem(userId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    include: { product: true },
  });
  if (!item) throw ApiError.notFound('Item is not in your cart');

  if (quantity > item.product.stock) {
    throw ApiError.badRequest(`Only ${item.product.stock} unit(s) in stock`);
  }

  await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId } },
    data: { quantity },
  });

  return buildCart(userId);
}

export async function removeItem(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem
    .delete({ where: { cartId_productId: { cartId: cart.id, productId } } })
    .catch(() => {
      throw ApiError.notFound('Item is not in your cart');
    });
  return buildCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return buildCart(userId);
}
