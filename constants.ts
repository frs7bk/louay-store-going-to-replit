

import { Product, ProductReview, ProductQuestion, OrderStatus } from './types';

export const APP_NAME = "louay store";

export const NAV_LINKS = [
  { nameKey: 'navHome', path: '/' },
  { nameKey: 'navCart', path: '/cart' },
  { nameKey: 'navTrackOrder', path: '/track-order' },
  { nameKey: 'navAdminPanel', path: '/admin' },
];

export const SAMPLE_PRODUCTS: Product[] = [];

export const ORDER_STATUSES: OrderStatus[] = [
  "Pending Approval",
  "Processing",
  "Preparing for Shipment",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
];


export const MOCK_REVIEWS: ProductReview[] = [];

export const MOCK_QUESTIONS: ProductQuestion[] = [];