import { z } from 'zod';

export const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  address: z.string().trim().min(3).max(255),
  address2: z.string().trim().max(255).nullish(),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  country: z.string().length(2),
  phone: z.string().trim().min(3).max(30),
});

export const orderItemsSchema = z.array(z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(1000),
  size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']),
})).min(1).max(100);
