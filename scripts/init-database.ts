import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { countries } from '../src/seed/seed.countries';
import { z } from 'zod';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
async function main() {
  await prisma.country.createMany({ data: countries, skipDuplicates: true });
  await prisma.category.createMany({
    data: ['Shirts', 'Pants', 'Hoodies', 'Hats'].map((name) => ({ name })), skipDuplicates: true,
  });
  if (process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD) {
    const admin = z.object({
      email: z.string().email().transform((s) => s.toLowerCase()),
      password: z.string().min(12).max(72),
    }).safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    if (!admin.success) throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (12 a 72 caracteres).');
    const existing = await prisma.user.findUnique({ where: { email: admin.data.email } });
    if (existing && existing.role !== 'admin') {
      throw new Error('El correo ya pertenece a un usuario. Revisa su rol manualmente antes de continuar.');
    }
    if (!existing) await prisma.user.create({ data: {
      name: 'Administrador', email: admin.data.email,
      password: await bcrypt.hash(admin.data.password, 12), role: 'admin',
    } });
    console.log('Cuenta administradora verificada; no se modificaron contraseñas existentes.');
  }
  console.log('Países y categorías inicializados sin borrar datos.');
}
main().catch(() => {
  console.error('No se pudo inicializar. Comprueba la conexión y las variables ADMIN_EMAIL/ADMIN_PASSWORD.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
