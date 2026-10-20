import { v2 as cloudinary } from 'cloudinary';
export const IMAGE_FOLDER = 'teslo-shop/';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 8;
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
export function getCloudinary() {
  const value = process.env.CLOUDINARY_URL;
  if (!value) throw new Error('Configura CLOUDINARY_URL para subir imágenes.');
  const url = new URL(value);
  if (url.protocol !== 'cloudinary:' || !url.hostname || !url.username || !url.password) {
    throw new Error('CLOUDINARY_URL no tiene un formato válido.');
  }
  cloudinary.config({ cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password), secure: true });
  return cloudinary;
}
export function getLegacyPublicId(url: string, cloudName: string): string | null {
  try {
    const parsed = new URL(url);
    const prefix = `/${cloudName}/image/upload/`;
    if (parsed.hostname !== 'res.cloudinary.com' || !parsed.pathname.startsWith(prefix)) return null;
    const path = parsed.pathname.slice(prefix.length).replace(/^v\d+\//, '');
    return decodeURIComponent(path).replace(/\.[^.\/]+$/, '');
  } catch { return null; }
}
