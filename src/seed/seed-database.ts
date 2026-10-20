import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { initialData } from './seed';
import { countries } from './seed.countries';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Los productos de demostración solo se cargan en una base local.');
  }
  await prisma.country.createMany({ data: countries, skipDuplicates: true });
  await prisma.category.createMany({ data: initialData.categories.map((name) => ({ name })), skipDuplicates: true });
  const categories = await prisma.category.findMany();
  for (const { type, images, ...product } of initialData.products) {
    const category = categories.find((c) => c.name.toLowerCase() === type);
    if (!category) throw new Error('Categoría faltante.');
    await prisma.product.upsert({
      where: { slug: product.slug }, update: {},
      create: { ...product, categoryId: category.id,
        ProductImage: { create: [...new Set(images)].map((url) => ({ url })) } },
    });
  }
  console.log('Catálogo de demostración agregado. Se conservaron los datos existentes; no se crearon usuarios de prueba.');
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
