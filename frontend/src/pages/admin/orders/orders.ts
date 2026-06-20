import { getPedidos, getUsuarios, getProductos, getPedidosMemoria, updatePedido } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { adminShell, bindAdminLogout } from '../adminHome/adminHome';
import {
  navigate,
  escapeHtml,
  formatPrice,
  estadoBadgeClass,
  formatOrderDate,
  orderDisplayId,
  formaPagoText,
} from '../../../utils/helpers';
import type { EstadoPedido, Pedido } from '../../../types';
import type { Usuario } from '../../../types';

let filtroEstado = '';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los pedidos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'TERMINADO', label: 'Terminado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const ESTADO_OPTIONS: { value: EstadoPedido; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'TERMINADO', label: 'Terminado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

function renderAdminOrderCard(
  p: Pedido,
  cliente: string,
): string {
  const totalItems = p.detalles.reduce((sum, d) => sum + d.cantidad, 0);

  return `
    <article class="admin-order-card admin-order" data-id="${p.id}">
      <div class="admin-order-card-top">
        <div class="admin-order-card-info">
          <span class="admin-order-id">Pedido #${orderDisplayId(p.id)}</span>
          <p class="admin-order-client">Cliente: ${escapeHtml(cliente)}</p>
          <p class="admin-order-date">${formatOrderDate(p.fecha)}</p>
        </div>
        <span class="order-status-pill ${estadoBadgeClass(p.estado)}">${p.estado}</span>
      </div>
      <hr class="order-divider" />
      <div class="admin-order-card-footer">
        <span class="admin-order-qty">${totalItems} producto(s)</span>
        <span class="admin-order-total">${formatPrice(p.total)}</span>
      </div>
    </article>`;
}

function renderAdminOrderDetailModal(
  pedido: Pedido,
  user: Usuario | undefined,
  productos: Awaited<ReturnType<typeof getProductos>>,
): string {
  const subtotal = pedido.detalles.reduce((sum, d) => sum + d.subtotal, 0);
  const envio = Math.max(0, pedido.total - subtotal);
  const cliente = user ? `${user.nombre} ${user.apellido}` : 'Desconocido';
  const telefono = pedido.telefono ?? user?.celular ?? 'No registrado';
  const direccion = pedido.direccion ?? 'No registrada';

  const productCards = pedido.detalles.map((d) => {
    const prod = productos.find((p) => p.id === d.idProducto);
    const nombre = prod?.nombre ?? `Producto #${d.idProducto}`;
    const unitPrice = d.cantidad > 0 ? d.subtotal / d.cantidad : d.subtotal;
    return `
      <article class="admin-order-detail-product">
        <div class="admin-order-detail-product-top">
          <span class="admin-order-detail-product-name">${escapeHtml(nombre)}</span>
          <span class="admin-order-detail-product-price">${formatPrice(d.subtotal)}</span>
        </div>
        <p class="admin-order-detail-product-qty">Cantidad: ${d.cantidad} x ${formatPrice(unitPrice)}</p>
      </article>`;
  }).join('');

  const estadoOptions = ESTADO_OPTIONS.map(
    (e) => `<option value="${e.value}" ${pedido.estado === e.value ? 'selected' : ''}>${e.label}</option>`,
  ).join('');

  return `
    <div class="modal-content admin-order-detail-modal">
      <div class="admin-form-modal-header">
        <h3>Detalle del Pedido #${orderDisplayId(pedido.id)}</h3>
        <button type="button" id="close-admin-modal" class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="admin-order-detail-info">
        <p><strong>Cliente:</strong> ${escapeHtml(cliente)}</p>
        <p><strong>Fecha:</strong> ${formatOrderDate(pedido.fecha)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
        <p><strong>Dirección:</strong> ${escapeHtml(direccion)}</p>
        <p><strong>Método de pago:</strong> ${formaPagoText(pedido.formaPago)}</p>
      </div>
      <section class="admin-order-detail-section">
        <h4>Productos:</h4>
        <div class="admin-order-detail-products">${productCards}</div>
      </section>
      <section class="admin-order-detail-summary">
        <div class="admin-order-detail-summary-row">
          <span>Subtotal:</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="admin-order-detail-summary-row">
          <span>Envío:</span>
          <span>${formatPrice(envio)}</span>
        </div>
        <hr class="admin-order-detail-summary-divider" />
        <div class="admin-order-detail-summary-total">
          <span>Total:</span>
          <span>${formatPrice(pedido.total)}</span>
        </div>
      </section>
      <div class="admin-order-detail-actions">
        <label class="admin-order-status-label">Cambiar Estado:
          <select id="new-estado">${estadoOptions}</select>
        </label>
        <button type="button" id="save-estado" class="btn-admin-update">Actualizar Estado</button>
      </div>
    </div>`;
}

function closeAdminOrderModal(): void {
  document.getElementById('admin-order-modal')?.classList.add('hidden');
}

export async function renderAdminOrders(): Promise<string> {
  const session = getSession();
  if (!session || session.rol !== 'ADMIN') { navigate('/login'); return ''; }

  const [pedidos, usuarios] = await Promise.all([
    getPedidos(), getUsuarios(),
  ]);
  const userMap = new Map(usuarios.map((u) => [u.id, `${u.nombre} ${u.apellido}`]));

  let filtered = [...pedidos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (filtroEstado) filtered = filtered.filter((p) => p.estado === filtroEstado);

  const cards = filtered.map((p) =>
    renderAdminOrderCard(p, userMap.get(p.idUsuario) ?? 'Desconocido'),
  ).join('');

  const filterOptions = FILTER_OPTIONS.map(
    (o) => `<option value="${o.value}" ${filtroEstado === o.value ? 'selected' : ''}>${o.label}</option>`,
  ).join('');

  return adminShell('orders', `
    <main class="admin-content">
      <div class="admin-page-header">
        <h2 class="admin-page-title">Gestión de Pedidos</h2>
        <select id="filter-estado" class="admin-order-filter" aria-label="Filtrar pedidos">
          ${filterOptions}
        </select>
      </div>
      <div class="admin-orders-list">${cards || '<p class="admin-orders-empty">No hay pedidos.</p>'}</div>
      <div id="admin-order-modal" class="modal hidden"></div>
    </main>`);
}

export function bindAdminOrders(rerender: () => void): void {
  bindAdminLogout();

  document.getElementById('filter-estado')?.addEventListener('change', (e) => {
    filtroEstado = (e.target as HTMLSelectElement).value;
    rerender();
  });

  document.querySelectorAll('.admin-order').forEach((card) => {
    card.addEventListener('click', async () => {
      const id = Number((card as HTMLElement).dataset.id);
      const [pedidos, usuarios, productos] = await Promise.all([
        getPedidos(), getUsuarios(), getProductos(),
      ]);
      const pedido = pedidos.find((p) => p.id === id);
      if (!pedido) return;
      const user = usuarios.find((u) => u.id === pedido.idUsuario);
      const modal = document.getElementById('admin-order-modal');
      if (!modal) return;

      modal.innerHTML = renderAdminOrderDetailModal(pedido, user, productos);
      modal.classList.remove('hidden');

      document.getElementById('close-admin-modal')?.addEventListener('click', closeAdminOrderModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAdminOrderModal();
      }, { once: true });

      document.getElementById('save-estado')?.addEventListener('click', () => {
        const nuevoEstado = (document.getElementById('new-estado') as HTMLSelectElement).value as EstadoPedido;
        const p = getPedidosMemoria().find((x) => x.id === id);
        if (p) { p.estado = nuevoEstado; updatePedido(p); }
        closeAdminOrderModal();
        rerender();
      });
    });
  });
}

export function resetOrderFilter(): void {
  filtroEstado = '';
}
