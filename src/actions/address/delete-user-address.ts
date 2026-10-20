'use server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
export async function deleteUserAddress(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) return { ok: false, message: 'No puedes eliminar esta dirección.' };
  await prisma.userAddress.deleteMany({ where: { userId: user.id } });
  return { ok: true };
}
