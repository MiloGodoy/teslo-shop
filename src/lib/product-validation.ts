import { z } from 'zod';

// Parentheses and underscores already occur in the catalog's public URLs.
export const productSlugSchema = z.string().trim().toLowerCase()
  .transform((slug) => slug.replace(/\s+/g, '-'))
  .pipe(z.string().min(3).max(255).regex(/^[a-z0-9_()-]+$/,
    'Usa letras, números, guiones, guiones bajos o paréntesis en el slug.'));
