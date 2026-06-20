import { getCategorias, getProductos, getPedidos } from '../../../utils/api';
import { getSession, clearSession } from '../../../utils/auth';
import { escapeHtml, navigate } from '../../../utils/helpers';

export function renderAdminHeader(): string {
  const session = getSession();
  const nombre = session
    ? escapeHtml(`${session.nombre} ${session.apellido}`.trim())
    : '';

  return `
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <a href="#/admin" class="admin-logo">🍕 Food Store</a>
        <nav class="admin-topbar-nav">
          <a href="#/store">Tienda</a>
          <a href="#/admin" class="admin-topbar-active">Panel Admin</a>
          <span class="admin-topbar-user">${nombre}</span>
          <button type="button" id="admin-header-logout" class="btn-admin-logout">Cerrar Sesión</button>
        </nav>
      </div>
    </header>`;
}

export function adminSidebar(active: string): string {
  const link = (key: string, href: string, icon: string, label: string) =>
    `<a href="${href}" class="admin-nav-link ${active === key ? 'active' : ''}"><span class="admin-nav-icon" aria-hidden="true">${icon}</span> ${label}</a>`;

  return `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <h2>Administración</h2>
        <p>Panel de control</p>
      </div>
      <nav class="admin-sidebar-nav">
        ${link('admin', '#/admin', '📊', 'Dashboard')}
        ${link('categories', '#/admin/categories', '📁', 'Categorías')}
        ${link('products', '#/admin/products', '🍔', 'Productos')}
        ${link('orders', '#/admin/orders', '📦', 'Pedidos')}
      </nav>
      <div class="admin-sidebar-footer">
        <a href="#/store" class="admin-nav-link admin-store-link"><span class="admin-nav-icon" aria-hidden="true">🏪</span> Ver Tienda</a>
      </div>
    </aside>`;
}

export function adminShell(active: string, content: string): string {
  return `
    <div class="admin-shell">
      ${renderAdminHeader()}
      <div class="admin-layout">
        ${adminSidebar(active)}
        ${content}
      </div>
    </div>`;
}

export function bindAdminLogout(): void {
  const logout = () => {
    clearSession();
    navigate('/login');
  };
  document.getElementById('admin-header-logout')?.addEventListener('click', logout);
  document.getElementById('admin-logout')?.addEventListener('click', logout);
}

export async function renderAdminHome(): Promise<string> {
  const session = getSession();
  if (!session || session.rol !== 'ADMIN') { navigate('/login'); return ''; }

  const [categorias, productos, pedidos] = await Promise.all([
    getCategorias(), getProductos(), getPedidos(),
  ]);

  const catActivas = categorias.filter((c) => !c.eliminado).length;
  const prodActivos = productos.filter((p) => !p.eliminado).length;
  const prodDisponibles = productos.filter((p) => !p.eliminado && p.disponible).length;
  const pedidosPendientes = pedidos.filter((p) => p.estado === 'PENDIENTE').length;
  const pedidosConfirmados = pedidos.filter((p) => p.estado === 'CONFIRMADO').length;
  const pedidosTerminados = pedidos.filter((p) => p.estado === 'TERMINADO').length;

  return adminShell('admin', `
    <main class="admin-content">
      <h2 class="admin-page-title">Panel de Administración</h2>
      <div class="admin-dash-grid">
        <article class="admin-dash-card admin-dash-card-cats">
          <span class="admin-dash-icon" aria-hidden="true">📁</span>
          <h3>Categorías</h3>
          <p class="admin-dash-count">${catActivas}</p>
          <a href="#/admin/categories" class="admin-dash-btn admin-dash-btn-cats">Gestionar</a>
        </article>
        <article class="admin-dash-card admin-dash-card-prods">
          <span class="admin-dash-icon" aria-hidden="true">🍔</span>
          <h3>Productos</h3>
          <p class="admin-dash-count">${prodActivos}</p>
          <a href="#/admin/products" class="admin-dash-btn admin-dash-btn-prods">Gestionar</a>
        </article>
        <article class="admin-dash-card admin-dash-card-orders">
          <span class="admin-dash-icon" aria-hidden="true">📦</span>
          <h3>Pedidos</h3>
          <p class="admin-dash-count">${pedidos.length}</p>
          <a href="#/admin/orders" class="admin-dash-btn admin-dash-btn-orders">Gestionar</a>
        </article>
        <article class="admin-dash-card admin-dash-card-available">
          <span class="admin-dash-icon" aria-hidden="true">✅</span>
          <h3>Disponibles</h3>
          <p class="admin-dash-count">${prodDisponibles}</p>
          <p class="admin-dash-sub">Productos activos</p>
        </article>
      </div>
      <section class="admin-quick-summary">
        <h3><span aria-hidden="true">📊</span> Resumen Rápido</h3>
        <div class="admin-summary-grid">
          <div class="admin-summary-item">
            <span class="admin-summary-label">Categorías activas</span>
            <span class="admin-summary-value">${catActivas}</span>
          </div>
          <div class="admin-summary-item">
            <span class="admin-summary-label">Productos en catálogo</span>
            <span class="admin-summary-value">${prodActivos}</span>
          </div>
          <div class="admin-summary-item">
            <span class="admin-summary-label">Pedidos pendientes</span>
            <span class="admin-summary-value">${pedidosPendientes}</span>
          </div>
          <div class="admin-summary-item">
            <span class="admin-summary-label">Pedidos confirmados</span>
            <span class="admin-summary-value">${pedidosConfirmados}</span>
          </div>
          <div class="admin-summary-item">
            <span class="admin-summary-label">Pedidos terminados</span>
            <span class="admin-summary-value">${pedidosTerminados}</span>
          </div>
          <div class="admin-summary-item">
            <span class="admin-summary-label">Productos disponibles</span>
            <span class="admin-summary-value">${prodDisponibles}</span>
          </div>
        </div>
      </section>
    </main>`);
}
