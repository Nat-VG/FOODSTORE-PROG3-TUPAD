import type { CartItem } from '../types';

const CART_KEY = 'foodstore_cart';

export function getCart(): CartItem[] {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.cantidad, 0);
}

export function updateCartBadge(): void {
  const count = getCartCount();
  document.querySelectorAll('.cart-link').forEach((el) => {
    el.textContent = `Carrito (${count})`;
  });
}

export function addToCart(item: Omit<CartItem, 'cantidad'>, cantidad: number): boolean {
  const cart = getCart();
  const existing = cart.find((i) => i.idProducto === item.idProducto);
  const currentQty = existing?.cantidad ?? 0;
  if (currentQty + cantidad > item.stock) return false;
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    cart.push({ ...item, cantidad });
  }
  saveCart(cart);
  return true;
}

export function updateCartQuantity(idProducto: number, cantidad: number, stock: number): boolean {
  if (cantidad <= 0 || cantidad > stock) return false;
  const cart = getCart();
  const item = cart.find((i) => i.idProducto === idProducto);
  if (!item) return false;
  item.cantidad = cantidad;
  saveCart(cart);
  return true;
}

export function removeFromCart(idProducto: number): void {
  saveCart(getCart().filter((i) => i.idProducto !== idProducto));
}

export function getCartSubtotal(): number {
  return getCart().reduce((sum, i) => sum + i.precio * i.cantidad, 0);
}
