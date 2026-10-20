'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/authorization';
import { getCloudinary, getLegacyPublicId } from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function deleteProductImage(imageId: number, _imageUrl?: string) {
  if ((await getCurrentUser())?.role !== 'admin') {
    return { ok: false, message: 'Se requiere una cuenta administradora.' };
  }
  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }, include: { product: { select: { slug: true } } },
    });
    if (!image) return { ok: false, message: 'La imagen ya no existe.' };
    if (image.url.startsWith('https://')) {
      const client = getCloudinary();
      const publicId = image.publicId ?? getLegacyPublicId(image.url, client.config().cloud_name!);
      if (!publicId) return { ok: false, message: 'Esta imagen no pertenece a tu cuenta de Cloudinary.' };
      const result = await client.uploader.destroy(publicId, { invalidate: true });
      if (!['ok', 'not found'].includes(result.result)) throw new Error('Cloudinary delete failed');
    }
    // Local assets remain in public/; only the product association is removed.
    await prisma.productImage.delete({ where: { id: imageId } });
    revalidatePath('/');
    revalidatePath('/gender/[gender]', 'page');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/product/${image.product.slug}`);
    revalidatePath(`/product/${image.product.slug}`);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo eliminar la imagen. Revisa Cloudinary y vuelve a intentar.' };
  }
}
