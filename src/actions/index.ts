// actions/index.ts
export { login } from './auth/login';
export { logout } from './auth/logout';
export { registerUser } from './auth/register';

export { placeOrder } from './order/place-order';
export { getOrderById } from './order/get-order-by-id';
export { getPaginatedOrders } from './order/get-paginated-orders';
export { getOrdersByUser } from './order/get-orders-by-user';

export { setTransactionId } from './payments/set-transaction-id';
export { paypalCheckPayment } from './payments/paypal-check-payment';

export { getCountries } from './country/get-countries';

export { getPaginatedProductsWithImages } from './product/product-pagination';
export { getProductBySlug } from './product/get-product-by-slug';
export { getStockBySlug } from './product/get-stock-by-slug';
export { createUpdateProduct } from './product/create-update-product';
export { deleteProductImage } from './product/delete-product-image';

export { setUserAddress } from './address/set-user-address';
export { deleteUserAddress } from './address/delete-user-address';

export { getPaginatedUsers } from './user/get-paginated-users';
export { changeUserRole } from './user/change-user-rol';

export { getCategories } from './category/get-categories';
