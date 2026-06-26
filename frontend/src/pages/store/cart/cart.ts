import { getPedidosMemoria, addPedido, nextId, getProductos } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { getCart, clearCart, removeFromCart, updateCartQuantity, getCartSubtotal } from '../../../utils/cart';
import { ENVIO } from '../../../utils/config';
import { navigate, formatPrice, escapeHtml, showToast, storeFooter, productImage, renderStoreHeader, bindStoreHeaderLogout } from '../../../utils/helpers';
import type { FormaPago, Pedido } from '../../../types';

const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

function renderCheckoutModal(total: number, telefonoDefault = ''): string {
  return `
    <div id="checkout-modal" class="modal hidden">
      <div class="modal-content checkout-modal">
        <div class="checkout-modal-header">
          <h3>Completar Pedido</h3>
          <button type="button" id="close-checkout" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <form id="checkout-form">
          <label>Teléfono
            <input type="tel" name="telefono" placeholder="Ej: +54 9 261 123-4567" value="${escapeHtml(telefonoDefault)}" required />
          </label>
          <label>Dirección de Entrega
            <textarea name="direccion" rows="3" placeholder="Calle, número, piso, depto" required></textarea>
          </label>
          <label>Método de Pago
            <select name="formaPago" required>
              <option value="">Seleccione un método</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </label>
          <label>Notas adicionales (opcional)
            <textarea name="notas" rows="3" placeholder="Instrucciones especiales, timbre, etc."></textarea>
          </label>
          <hr class="checkout-modal-divider" />
          <div class="checkout-modal-total">
            <span>Total a pagar:</span>
            <span>${formatPrice(total)}</span>
          </div>
          <button type="submit" class="btn btn-confirm-order">Confirmar Pedido</button>
        </form>
      </div>
    </div>`;
}

function closeCheckoutModal(): void {
  document.getElementById('checkout-modal')?.classList.add('hidden');
}

export async function renderCart(): Promise<string> {
  const session = getSession();
  if (!session) { navigate('/login'); return ''; }

  const cart = getCart();
  if (cart.length === 0) {
    return `
      ${renderStoreHeader()}
      <main class="page empty-state">
        <h2>Tu carrito está vacío</h2>
        <p>Agregá productos desde el catálogo.</p>
        <a href="#/store" class="btn btn-primary">Ir a la tienda</a>
      </main>
      ${storeFooter()}`;
  }

  const productos = await getProductos();
  const items = cart.map((item) => {
    const producto = productos.find((p) => p.id === item.idProducto);
    const descripcion = producto?.descripcion ?? '';

    return `
    <article class="cart-item" data-id="${item.idProducto}">
      <img class="cart-item-img" src="${productImage(item.idProducto, item.imagen)}" alt="${escapeHtml(item.nombre)}" loading="lazy" />
      <div class="cart-item-details">
        <h4 class="cart-item-name">${escapeHtml(item.nombre)}</h4>
        <p class="cart-item-desc">${escapeHtml(descripcion)}</p>
        <p class="cart-item-unit">${formatPrice(item.precio)} c/u</p>
      </div>
      <div class="cart-item-qty">
        <div class="qty-controls">
          <button type="button" class="qty-btn qty-minus" aria-label="Disminuir cantidad">−</button>
          <span class="qty-value">${item.cantidad}</span>
          <button type="button" class="qty-btn qty-plus" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
      <p class="cart-item-subtotal">${formatPrice(item.precio * item.cantidad)}</p>
      <button type="button" class="btn-remove" aria-label="Eliminar producto">${TRASH_ICON}</button>
    </article>`;
  }).join('');

  const subtotal = getCartSubtotal();
  const total = subtotal + ENVIO;

  return `
    ${renderStoreHeader()}
    <main class="page cart-page">
      <div class="cart-layout">
        <section class="cart-main">
          <h2 class="cart-title">Mi Carrito</h2>
          <div class="cart-items">${items}</div>
        </section>
        <aside class="cart-sidebar">
          <div class="cart-summary-card">
            <h3>Resumen del Pedido</h3>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Envío:</span>
              <span>${formatPrice(ENVIO)}</span>
            </div>
            <hr class="summary-divider" />
            <div class="summary-total">
              <span>Total:</span>
              <span>${formatPrice(total)}</span>
            </div>
            <button type="button" id="checkout-toggle" class="btn btn-checkout">Proceder al Pago</button>
            <button type="button" id="clear-cart" class="btn btn-clear-cart">Vaciar Carrito</button>
          </div>
        </aside>
      </div>
      ${renderCheckoutModal(total, session.celular ?? '')}
    </main>
    ${storeFooter()}`;
}

export function bindCart(rerender: () => void): void {
  bindStoreHeaderLogout();

  document.getElementById('clear-cart')?.addEventListener('click', () => {
    clearCart();
    rerender();
  });

  document.getElementById('checkout-toggle')?.addEventListener('click', () => {
    document.getElementById('checkout-modal')?.classList.remove('hidden');
  });

  document.getElementById('close-checkout')?.addEventListener('click', closeCheckoutModal);

  document.getElementById('checkout-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCheckoutModal();
  });

  document.querySelectorAll('.cart-item').forEach((row) => {
    const id = Number((row as HTMLElement).dataset.id);
    row.querySelector('.btn-remove')?.addEventListener('click', () => {
      removeFromCart(id);
      rerender();
    });
    row.querySelector('.qty-minus')?.addEventListener('click', async () => {
      const cart = getCart();
      const item = cart.find((i) => i.idProducto === id);
      if (!item) return;
      if (item.cantidad <= 1) { removeFromCart(id); } else {
        updateCartQuantity(id, item.cantidad - 1, item.stock);
      }
      rerender();
    });
    row.querySelector('.qty-plus')?.addEventListener('click', () => {
      const cart = getCart();
      const item = cart.find((i) => i.idProducto === id);
      if (!item) return;
      if (updateCartQuantity(id, item.cantidad + 1, item.stock)) rerender();
    });
  });

  document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const session = getSession();
    if (!session) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const cart = getCart();
    if (cart.length === 0) return;

    const formaPago = String(fd.get('formaPago'));
    if (!formaPago) return;

    const pedidos = getPedidosMemoria();
    const subtotal = getCartSubtotal();
    const notas = String(fd.get('notas') ?? '').trim();
    const pedido: Pedido = {
      id: nextId(pedidos),
      fecha: new Date().toISOString(),
      estado: 'PENDIENTE',
      total: subtotal + ENVIO,
      formaPago: formaPago as FormaPago,
      idUsuario: session.id,
      telefono: String(fd.get('telefono')),
      direccion: String(fd.get('direccion')),
      ...(notas ? { notas } : {}),
      detalles: cart.map((item) => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad,
      })),
    };

    const productos = await getProductos();
    for (const item of cart) {
      const prod = productos.find((p) => p.id === item.idProducto);
      if (!prod) continue;
      prod.stock = Math.max(0, prod.stock - item.cantidad);
    }

    addPedido(pedido);
    clearCart();
    closeCheckoutModal();
    showToast('Pedido confirmado');
    navigate('/orders');
  });
}
