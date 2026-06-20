import { getPedidos, getProductos } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import type { Pedido } from '../../../types';
import {
  navigate,
  formatPrice,
  escapeHtml,
  estadoBadgeClass,
  formatOrderDate,
  orderDisplayId,
  formaPagoLabel,
  orderStatusMessage,
  storeFooter,
  renderStoreHeader,
  bindStoreHeaderLogout,
} from '../../../utils/helpers';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'TERMINADO', label: 'Terminado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

function renderOrderCard(
  p: Awaited<ReturnType<typeof getPedidos>>[number],
  productos: Awaited<ReturnType<typeof getProductos>>,
): string {
  const productLines = p.detalles.map((d) => {
    const prod = productos.find((pr) => pr.id === d.idProducto);
    const nombre = prod?.nombre ?? `Producto #${d.idProducto}`;
    return `<li>${escapeHtml(nombre)} (x${d.cantidad})</li>`;
  }).join('');

  const totalItems = p.detalles.reduce((sum, d) => sum + d.cantidad, 0);

  return `
    <article class="order-card" data-id="${p.id}" data-estado="${p.estado}">
      <div class="order-card-top">
        <span class="order-id">Pedido #${orderDisplayId(p.id)}</span>
        <span class="order-status-pill ${estadoBadgeClass(p.estado)}">${p.estado}</span>
      </div>
      <hr class="order-divider" />
      <p class="order-date"><span class="order-date-icon" aria-hidden="true">📅</span> ${formatOrderDate(p.fecha)}</p>
      <hr class="order-divider" />
      <ul class="order-products">${productLines}</ul>
      <hr class="order-divider" />
      <div class="order-card-footer">
        <span class="order-qty"><span class="order-qty-icon" aria-hidden="true">📦</span> ${totalItems} producto(s)</span>
        <span class="order-total">${formatPrice(p.total)}</span>
      </div>
    </article>`;
}

function renderOrderDetailModal(
  pedido: Pedido,
  productos: Awaited<ReturnType<typeof getProductos>>,
): string {
  const subtotal = pedido.detalles.reduce((sum, d) => sum + d.subtotal, 0);
  const envio = Math.max(0, pedido.total - subtotal);
  const statusMsg = orderStatusMessage(pedido.estado);

  const productCards = pedido.detalles.map((d) => {
    const prod = productos.find((p) => p.id === d.idProducto);
    const nombre = prod?.nombre ?? `Producto #${d.idProducto}`;
    const unitPrice = d.cantidad > 0 ? d.subtotal / d.cantidad : d.subtotal;
    return `
      <article class="order-detail-product">
        <div class="order-detail-product-top">
          <span class="order-detail-product-name">${escapeHtml(nombre)}</span>
          <span class="order-detail-product-price">${formatPrice(d.subtotal)}</span>
        </div>
        <p class="order-detail-product-qty">Cantidad: ${d.cantidad} x ${formatPrice(unitPrice)}</p>
      </article>`;
  }).join('');

  const notasBlock = pedido.notas
    ? `<p class="order-detail-info-row"><strong>Notas:</strong> ${escapeHtml(pedido.notas)}</p>`
    : '';

  return `
    <div class="modal-content order-detail-modal">
      <button type="button" id="close-modal" class="modal-close order-detail-close" aria-label="Cerrar">&times;</button>
      <div class="order-detail-header">
        <span class="order-detail-pill ${estadoBadgeClass(pedido.estado)}">${pedido.estado}</span>
        <p class="order-detail-date"><span aria-hidden="true">📅</span> ${formatOrderDate(pedido.fecha)}</p>
      </div>
      <section class="order-detail-block">
        <h4 class="order-detail-block-title"><span aria-hidden="true">📍</span> Información de Entrega</h4>
        <div class="order-detail-info">
          <p class="order-detail-info-row"><strong>Dirección:</strong> ${escapeHtml(pedido.direccion ?? 'No registrada')}</p>
          <p class="order-detail-info-row"><strong>Teléfono:</strong> ${escapeHtml(pedido.telefono ?? 'No registrado')}</p>
          <p class="order-detail-info-row"><strong>Método de pago:</strong> ${formaPagoLabel(pedido.formaPago)}</p>
          ${notasBlock}
        </div>
      </section>
      <section class="order-detail-block">
        <h4 class="order-detail-block-title"><span aria-hidden="true">🛍️</span> Productos</h4>
        <div class="order-detail-products">${productCards}</div>
      </section>
      <section class="order-detail-summary">
        <div class="order-detail-summary-row">
          <span>Subtotal:</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="order-detail-summary-row">
          <span>Envío:</span>
          <span>${formatPrice(envio)}</span>
        </div>
        <hr class="order-detail-summary-divider" />
        <div class="order-detail-summary-total">
          <span>Total:</span>
          <span>${formatPrice(pedido.total)}</span>
        </div>
      </section>
      <div class="order-detail-alert ${statusMsg.alertClass}">
        <p class="order-detail-alert-title"><span aria-hidden="true">${statusMsg.icon}</span> ${statusMsg.title}</p>
        <p class="order-detail-alert-text">${statusMsg.text}</p>
      </div>
    </div>`;
}

function openOrderModal(html: string): void {
  const modal = document.getElementById('order-modal');
  if (!modal) return;
  modal.innerHTML = html;
  modal.classList.remove('hidden');

  const close = () => modal.classList.add('hidden');
  document.getElementById('close-modal')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  }, { once: true });
}

export async function renderClientOrders(): Promise<string> {
  const session = getSession();
  if (!session) { navigate('/login'); return ''; }

  const [pedidos, productos] = await Promise.all([getPedidos(), getProductos()]);
  const misPedidos = pedidos
    .filter((p) => p.idUsuario === session.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (misPedidos.length === 0) {
    return `
      ${renderStoreHeader()}
      <main class="page orders-page empty-state">
        <h2>No tenés pedidos aún</h2>
        <a href="#/store" class="btn btn-primary">Ir al catálogo</a>
      </main>
      ${storeFooter()}`;
  }

  const cards = misPedidos.map((p) => renderOrderCard(p, productos)).join('');
  const filterOptions = FILTER_OPTIONS.map(
    (o) => `<option value="${o.value}">${o.label}</option>`,
  ).join('');

  return `
    ${renderStoreHeader()}
    <main class="page orders-page">
      <div class="orders-page-header">
        <h2 class="orders-title">Mis Pedidos</h2>
        <select id="order-filter" class="order-filter" aria-label="Filtrar pedidos por estado">
          ${filterOptions}
        </select>
      </div>
      <div class="order-list">${cards}</div>
      <p id="orders-empty-filter" class="orders-empty-filter hidden">No hay pedidos con ese estado.</p>
      <div id="order-modal" class="modal hidden"></div>
    </main>
    ${storeFooter()}`;
}

function applyOrderFilter(estado: string): void {
  const cards = document.querySelectorAll('.order-card');
  let visible = 0;
  cards.forEach((card) => {
    const match = !estado || (card as HTMLElement).dataset.estado === estado;
    card.classList.toggle('hidden', !match);
    if (match) visible += 1;
  });
  document.getElementById('orders-empty-filter')?.classList.toggle('hidden', visible > 0);
}

export function bindClientOrders(): void {
  bindStoreHeaderLogout();

  document.getElementById('order-filter')?.addEventListener('change', (e) => {
    applyOrderFilter((e.target as HTMLSelectElement).value);
  });

  document.querySelectorAll('.order-card').forEach((card) => {
    card.addEventListener('click', async () => {
      const id = Number((card as HTMLElement).dataset.id);
      const [pedidos, productos] = await Promise.all([getPedidos(), getProductos()]);
      const pedido = pedidos.find((p) => p.id === id);
      if (!pedido) return;
      openOrderModal(renderOrderDetailModal(pedido, productos));
    });
  });
}
