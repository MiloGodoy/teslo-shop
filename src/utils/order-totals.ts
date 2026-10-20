// Keep the existing displayed 10% rate consistent in cart, orders and payments.
export const TAX_RATE = 0.1;
export function calculateTotals(items: { price: number; quantity: number }[]) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { subTotal: subtotalCents / 100, tax: taxCents / 100, total: (subtotalCents + taxCents) / 100 };
}
