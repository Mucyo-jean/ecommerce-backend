import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../utils/ApiError';
import { Role } from '@prisma/client';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

function publicUser(user: { id: string; name: string; email: string; phone: string | null; role: Role }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

function issueTokens(user: { id: string; email: string; role: Role }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict('Email is already registered');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      phone: input.phone,
      // Every new user also gets an empty cart.
      cart: { create: {} },
    },
  });

  return { user: publicUser(user), tokens: issueTokens(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await comparePassword(password, user.password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  return { user: publicUser(user), tokens: issueTokens(user) };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized('User no longer exists');
  return issueTokens(user);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
}
