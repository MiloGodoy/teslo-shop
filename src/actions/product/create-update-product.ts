'use server';

import prisma from '@/lib/prisma';
import { Gender, Size } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { productSlugSchema } from '@/lib/product-validation';
import { getCurrentUser } from '@/lib/authorization';
import { getCloudinary, IMAGE_FOLDER, IMAGE_FORMATS, MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from '@/lib/cloudinary';

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(255),
  slug: productSlugSchema,
  description: z.string().trim().min(1).max(10000),
  price: z.coerce.number().finite().min(0).max(1000000).transform((n) => Math.round(n * 100) / 100),
  inStock: z.coerce.number().int().min(0).max(1000000),
  categoryId: z.string().uuid(),
  sizes: z.string().transform((s) => s ? s.split(',') : [])
    .pipe(z.array(z.nativeEnum(Size)).max(7)),
  tags: z.string().max(1000).transform((s) => s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)),
  gender: z.nativeEnum(Gender),
});
const imageIdsSchema = z.array(z.string().startsWith(IMAGE_FOLDER).max(200)).max(MAX_PRODUCT_IMAGES);

export async function createUpdateProduct(formData: FormData) {
  if ((await getCurrentUser())?.role !== 'admin') {
    return { ok: false as const, message: 'Se requiere una cuenta administradora.' };
  }
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return {
    ok: false as const,
    message: parsed.error.issues[0]?.path[0] === 'slug'
      ? 'Revisa el slug: usa de 3 a 255 caracteres, letras, números, guiones, guiones bajos o paréntesis.'
      : 'Revisa los campos del producto.',
  };
  try {
    const ids = imageIdsSchema.parse(JSON.parse(String(formData.get('uploadedImages') ?? '[]')));
    if (new Set(ids).size !== ids.length) throw new Error('Imágenes repetidas.');
    // Query Cloudinary with server credentials instead of trusting browser URLs.
    const images: { url: string; publicId: string }[] = [];
    for (const publicId of ids) {
      const resource = await getCloudinary().api.resource(publicId, { resource_type: 'image', type: 'upload' });
      if (!IMAGE_FORMATS.includes(resource.format) || resource.bytes > MAX_IMAGE_BYTES ||
          resource.type !== 'upload' || resource.resource_type !== 'image') {
        throw new Error('Formato o tamaño de imagen no permitido.');
      }
      images.push({ url: resource.secure_url as string, publicId });
    }
    const { id, ...data } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const previous = id ? await tx.product.findUnique({ where: { id } }) : null;
      if (id && !previous) throw new Error('Producto inexistente.');
      const count = id ? await tx.productImage.count({ where: { productId: id } }) : 0;
      if (count + images.length > MAX_PRODUCT_IMAGES) throw new Error('Máximo 8 imágenes por producto.');
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });
      if (images.length) await tx.productImage.createMany({
        data: images.map((image) => ({ ...image, productId: product.id })),
      });
      return { product, oldSlug: previous?.slug };
    });
    revalidatePath('/');
    revalidatePath('/gender/[gender]', 'page');
    revalidatePath('/admin/products');
    for (const slug of new Set([result.product.slug, result.oldSlug].filter(Boolean))) {
      revalidatePath(`/admin/product/${slug}`);
      revalidatePath(`/product/${slug}`);
    }
    return { ok: true as const, product: result.product };
  } catch {
    return { ok: false as const, message: 'No se pudo guardar. Revisa el slug, las imágenes y la conexión con Cloudinary.' };
  }
}
