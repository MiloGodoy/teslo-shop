'use server';
import type { Address } from '@/interfaces';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
import { addressSchema } from '@/lib/validation';
export async function setUserAddress(address: Address, userId: string) {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) return { ok: false, message: 'No puedes modificar esta dirección.' };
  const parsed = addressSchema.safeParse(address);
  if (!parsed.success) return { ok: false, message: 'Revisa los campos de la dirección.' };
  try {
    const { country, ...rest } = parsed.data;
    const data = { ...rest, countryId: country };
    const saved = await prisma.userAddress.upsert({
      where: { userId: user.id }, update: data, create: { ...data, userId: user.id },
    });
    return { ok: true, address: saved };
  } catch { return { ok: false, message: 'No se pudo guardar la dirección.' }; }
}
