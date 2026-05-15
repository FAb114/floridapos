import { storageGet, storageSet } from './storage.js';

export async function saveOrder(order) {
  const orders = await loadOrders();
  orders.unshift(order);
  await storageSet('orders', orders.slice(0, 500));
}

export async function loadOrders() {
  return (await storageGet('orders')) || [];
}

export async function clearOrders() {
  await storageSet('orders', []);
}

export async function getTodayOrders() {
  const orders = await loadOrders();
  const today = new Date().toDateString();
  return orders.filter(o => new Date(o.createdAt).toDateString() === today);
}
