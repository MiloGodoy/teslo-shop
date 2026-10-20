'use server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
export async function getUserAddress(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) return null;
  const address = await prisma.userAddress.findUnique({ where: { userId: user.id } });
  if (!address) return null;
  const { countryId, ...rest } = address;
  return { ...rest, country: countryId };
}
