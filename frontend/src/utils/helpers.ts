import type { EstadoPedido } from '../types';
import { getSession, clearSession } from './auth';
import { getCartCount } from './cart';

export function navigate(path: string): void {
  window.location.hash = path;
}

export function getRoute(): string {
  return window.location.hash.slice(1) || '/login';
}

export function formatPrice(n: number): string {
  return `$${n.toLocaleString('es-AR')}`;
}

export function formatOrderDate(fecha: string): string {
  const date = fecha.includes('T')
    ? new Date(fecha)
    : (() => {
        const [y, m, d] = fecha.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0);
      })();
  const options: Intl.DateTimeFormatOptions = fecha.includes('T')
    ? { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }
    : { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleString('es-AR', options);
}

export function orderDisplayId(id: number): string {
  return `ORD-${id}`;
}

export function formaPagoLabel(forma: string): string {
  const map: Record<string, string> = {
    EFECTIVO: '💵 Efectivo',
    TARJETA: '💳 Tarjeta',
    TRANSFERENCIA: '🏦 Transferencia',
  };
  return map[forma] ?? forma;
}

export function formaPagoText(forma: string): string {
  const map: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TARJETA: 'Tarjeta',
    TRANSFERENCIA: 'Transferencia',
  };
  return map[forma] ?? forma;
}

export function orderStatusMessage(estado: EstadoPedido): { icon: string; title: string; text: string; alertClass: string } {
  const map: Record<EstadoPedido, { icon: string; title: string; text: string; alertClass: string }> = {
    PENDIENTE: {
      icon: '⏳',
      title: 'Tu pedido está siendo procesado',
      text: 'Te notificaremos cuando esté listo para entrega.',
      alertClass: 'order-detail-alert-pending',
    },
    CONFIRMADO: {
      icon: '👨‍🍳',
      title: 'Tu pedido fue confirmado',
      text: 'Estamos preparando tu pedido para el envío.',
      alertClass: 'order-detail-alert-confirmed',
    },
    TERMINADO: {
      icon: '✅',
      title: 'Tu pedido fue entregado',
      text: '¡Gracias por tu compra! Esperamos verte pronto.',
      alertClass: 'order-detail-alert-done',
    },
    CANCELADO: {
      icon: '❌',
      title: 'Este pedido fue cancelado',
      text: 'Si tenés dudas, contactanos para más información.',
      alertClass: 'order-detail-alert-cancelled',
    },
  };
  return map[estado];
}

export function estadoBadgeClass(estado: EstadoPedido): string {
  const map: Record<EstadoPedido, string> = {
    PENDIENTE: 'badge-pending',
    CONFIRMADO: 'badge-confirmed',
    TERMINADO: 'badge-done',
    CANCELADO: 'badge-cancelled',
  };
  return map[estado];
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function productImage(id: number, imagen?: string): string {
  if (imagen && !imagen.includes('foodish-api.com')) return imagen;
  return `/images/products/${id}.jpg`;
}

export function storeFooter(): string {
  return `
    <footer class="store-footer">
      <p>&copy; 2026 Food Store. Todos los derechos reservados.</p>
      <p>Contacto: <a href="mailto:info@foodstore.com">info@foodstore.com</a></p>
    </footer>`;
}

export function renderStoreHeader(): string {
  const session = getSession();
  const nombre = session
    ? escapeHtml(`${session.nombre} ${session.apellido}`.trim())
    : '';

  const adminLink = session?.rol === 'ADMIN'
    ? '<a href="#/admin" class="store-admin-link">Panel Admin</a>'
    : '';

  return `
    <header class="header">
      <div class="header-inner">
        <h1><a href="#/store" class="store-logo-link">🍕 Food Store 🍕</a></h1>
        <nav>
          <span class="user-greeting">Hola, ${nombre}</span>
          <a href="#/store">Catálogo</a>
          ${adminLink}
          <a href="#/cart" class="cart-link">Carrito (${getCartCount()})</a>
          <a href="#/orders">Mis Pedidos</a>
          <button id="logout-btn" class="btn btn-sm">Salir</button>
        </nav>
      </div>
    </header>`;
}

export function bindStoreHeaderLogout(): void {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    navigate('/login');
  });
}

export function renderDemoCredentials(): string {
  return `
    <div class="auth-demo">
      <p><strong>Credenciales de prueba</strong></p>
      <p>Admin: admin@admin.com / 123456</p>
      <p>Cliente: cliente@food.com / cliente123</p>
    </div>`;
}

export function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
