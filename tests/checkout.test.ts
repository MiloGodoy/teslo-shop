import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals } from '../src/utils/order-totals';
import { orderItemsSchema } from '../src/lib/validation';
import { getProductImageSrc } from '../src/utils/product-image';
import { paymentMatchesOrder, type PaypalOrder } from '../src/lib/paypal';
import { getLegacyPublicId } from '../src/lib/cloudinary';
import { productSlugSchema } from '../src/lib/product-validation';

test('product slugs preserve existing parentheses and reject URL separators', () => {
  assert.equal(productSlugSchema.parse('zero_emissions_(almost)_onesie'), 'zero_emissions_(almost)_onesie');
  assert.equal(productSlugSchema.parse('  New Product (Kids)  '), 'new-product-(kids)');
  for (const slug of ['invalid/path', 'invalid?query', 'invalid#fragment', 'ab']) {
    assert.equal(productSlugSchema.safeParse(slug).success, false);
  }
});

test('cart and server totals use cents and the same 10% rate', () => {
  assert.deepEqual(calculateTotals([{ price: 19.99, quantity: 3 }]), { subTotal: 59.97, tax: 6, total: 65.97 });
});
test('order input rejects negative/fractional quantities, unknown sizes and empty orders', () => {
  const item = { productId: 'c02016d9-0b1f-4a0c-b72a-b94250998911', quantity: 1, size: 'M' };
  assert.equal(orderItemsSchema.safeParse([item]).success, true);
  for (const quantity of [0, -1, 1.5, Infinity]) assert.equal(orderItemsSchema.safeParse([{ ...item, quantity }]).success, false);
  assert.equal(orderItemsSchema.safeParse([{ ...item, size: 'invalid' }]).success, false);
  assert.equal(orderItemsSchema.safeParse([]).success, false);
});
test('local, remote and missing product images resolve correctly', () => {
  assert.equal(getProductImageSrc('a.jpg'), '/products/a.jpg');
  assert.equal(getProductImageSrc('https://res.cloudinary.com/shop/image/upload/a.jpg'), 'https://res.cloudinary.com/shop/image/upload/a.jpg');
  assert.equal(getProductImageSrc('/imgs/placeholder.jpg'), '/imgs/placeholder.jpg');
  assert.equal(getProductImageSrc(undefined), '/imgs/placeholder.jpg');
  assert.equal(getProductImageSrc('1740507-00-A_0_2000.jpg'), '/products/1740507-00-A_1.jpg');
  assert.equal(getProductImageSrc('8765100-00-A_1.jpg'), '/imgs/placeholder.jpg');
});
test('Cloudinary legacy IDs preserve folders and reject other accounts', () => {
  assert.equal(getLegacyPublicId('https://res.cloudinary.com/shop/image/upload/v123/products/a.jpg', 'shop'), 'products/a');
  assert.equal(getLegacyPublicId('https://res.cloudinary.com/other/image/upload/a.jpg', 'shop'), null);
});
test('completed payments must match transaction, order, merchant, amount, currency and captures', () => {
  const order = { id: 'local-order', transactionId: 'PAYPAL123', total: 11 };
  const payment: PaypalOrder = { id: 'PAYPAL123', status: 'COMPLETED', purchase_units: [{
    invoice_id: order.id, amount: { currency_code: 'USD', value: '11.00' },
    payee: { merchant_id: 'MERCHANT' },
    payments: { captures: [{ status: 'COMPLETED', amount: { currency_code: 'USD', value: '11.00' } }] },
  }] };
  assert.equal(paymentMatchesOrder(payment, order, 'MERCHANT'), true);
  for (const mutate of [
    (p: PaypalOrder) => { p.id = 'OTHER'; },
    (p: PaypalOrder) => { p.status = 'APPROVED'; },
    (p: PaypalOrder) => { p.purchase_units[0].invoice_id = 'OTHER'; },
    (p: PaypalOrder) => { p.purchase_units[0].amount.value = '1.00'; },
    (p: PaypalOrder) => { p.purchase_units[0].amount.currency_code = 'EUR'; },
    (p: PaypalOrder) => { p.purchase_units[0].payee!.merchant_id = 'OTHER'; },
    (p: PaypalOrder) => { p.purchase_units[0].payments!.captures![0].status = 'PENDING'; },
    (p: PaypalOrder) => { p.purchase_units[0].payments!.captures![0].amount.value = '1.00'; },
  ]) {
    const forged = structuredClone(payment); mutate(forged);
    assert.equal(paymentMatchesOrder(forged, order, 'MERCHANT'), false);
  }
});
