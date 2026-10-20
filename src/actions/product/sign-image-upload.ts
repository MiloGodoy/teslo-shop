'use server';
import { randomUUID } from 'node:crypto';
import { getCurrentUser } from '@/lib/authorization';
import { getCloudinary, IMAGE_FOLDER, IMAGE_FORMATS } from '@/lib/cloudinary';
import prisma from '@/lib/prisma';
export async function signImageUpload() {
  if ((await getCurrentUser())?.role !== 'admin') {
    return { ok: false as const, message: 'Se requiere una cuenta administradora.' };
  }
  try {
    const client = getCloudinary();
    const params = { timestamp: Math.floor(Date.now() / 1000),
      public_id: `${IMAGE_FOLDER}${randomUUID()}`, overwrite: false,
      allowed_formats: IMAGE_FORMATS.join(',') };
    return { ok: true as const, params,
      signature: client.utils.api_sign_request(params, client.config().api_secret!),
      apiKey: client.config().api_key!, cloudName: client.config().cloud_name! };
  } catch {
    return { ok: false as const, message: 'Configura las credenciales de Cloudinary en el servidor.' };
  }
}
export async function discardUploadedImages(publicIds: string[]) {
  if ((await getCurrentUser())?.role !== 'admin') return;
  const ids = [...new Set(publicIds)].filter((id) => id.startsWith(IMAGE_FOLDER)).slice(0, 8);
  const client = getCloudinary();
  for (const publicId of ids) {
    // A lost save response must not remove an already committed image.
    const saved = await prisma.productImage.findFirst({ where: { publicId } });
    if (!saved) await client.uploader.destroy(publicId);
  }
}
