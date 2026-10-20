import { existsSync } from 'node:fs';
import { initialData } from '../src/seed/seed';
const images = [...new Set(initialData.products.flatMap((product) => product.images))];
const missing = images.filter((image) => !existsSync(`public${image.startsWith('/') ? image : `/products/${image}`}`));
if (missing.length) {
  console.error('Faltan imágenes:', missing.join(', ')); process.exitCode = 1;
} else console.log(`Verificadas ${images.length} imágenes del catálogo de demostración.`);
