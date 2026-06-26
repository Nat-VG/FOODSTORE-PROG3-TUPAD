import { getCategorias, getProductos } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { navigate, formatPrice, escapeHtml, storeFooter, productImage, renderStoreHeader, bindStoreHeaderLogout } from '../../../utils/helpers';
import type { Producto } from '../../../types';

let filtroCategoria = 0;
let busqueda = '';
let orden: 'az' | 'za' | 'precio-asc' | 'precio-desc' = 'az';
let catalogProductos: Producto[] = [];

function sortProducts(list: Producto[]): Producto[] {
  const copy = [...list];
  switch (orden) {
    case 'az': return copy.sort((a, b) => a.nombre.localeCompare(b.nombre));
    case 'za': return copy.sort((a, b) => b.nombre.localeCompare(a.nombre));
    case 'precio-asc': return copy.sort((a, b) => a.precio - b.precio);
    case 'precio-desc': return copy.sort((a, b) => b.precio - a.precio);
  }
}

function catalogBadge(producto: Producto): { className: string; label: string } {
  if (producto.stock === 0) {
    return { className: 'badge badge-pending', label: 'Sin stock' };
  }
  if (producto.disponible) {
    return { className: 'badge badge-done', label: 'Disponible' };
  }
  return { className: 'badge badge-cancelled', label: 'No disponible' };
}

function isUnavailable(producto: Producto): boolean {
  return !producto.disponible || producto.stock === 0;
}

function getFilteredProducts(): Producto[] {
  let filtered = catalogProductos.filter((p) => !p.eliminado && p.disponible);
  if (filtroCategoria > 0) {
    filtered = filtered.filter((p) => p.categoriaId === filtroCategoria);
  }
  if (busqueda.trim()) {
    const term = busqueda.toLowerCase();
    filtered = filtered.filter((p) => p.nombre.toLowerCase().includes(term));
  }
  return sortProducts(filtered);
}

function buildProductCardsHtml(productos: Producto[]): string {
  if (productos.length === 0) {
    return '<p class="empty">No hay productos.</p>';
  }
  return productos.map((p) => {
    const badge = catalogBadge(p);
    const unavailableClass = isUnavailable(p) ? ' product-card-unavailable' : '';
    return `
    <article class="product-card${unavailableClass}" data-id="${p.id}">
      <img src="${productImage(p.id, p.imagen)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />
      <div class="product-info">
        <h3>${escapeHtml(p.nombre)}</h3>
        <p>${escapeHtml(p.descripcion.slice(0, 60))}...</p>
        <div class="product-footer">
          <span class="price">${formatPrice(p.precio)}</span>
          <span class="${badge.className}">${badge.label}</span>
        </div>
      </div>
    </article>`;
  }).join('');
}

function bindProductCards(): void {
  document.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigate(`/product/${(card as HTMLElement).dataset.id}`);
    });
  });
}

function refreshProductGrid(): void {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;
  grid.innerHTML = buildProductCardsHtml(getFilteredProducts());
  bindProductCards();
}

export async function renderStoreHome(): Promise<string> {
  const session = getSession();
  if (!session) { navigate('/login'); return ''; }

  const [categorias, productos] = await Promise.all([getCategorias(), getProductos()]);
  catalogProductos = productos;

  const catOptions = categorias.filter((c) => !c.eliminado)
    .map((c) => `<button class="cat-btn ${filtroCategoria === c.id ? 'active' : ''}" data-cat="${c.id}">${escapeHtml(c.nombre)}</button>`)
    .join('');

  return `
    ${renderStoreHeader()}
    <main class="store-layout">
      <aside class="sidebar">
        <h3>Categorías</h3>
        <button class="cat-btn ${filtroCategoria === 0 ? 'active' : ''}" data-cat="0">Todas</button>
        ${catOptions}
      </aside>
      <section class="catalog">
        <h2>Productos Destacados</h2>
        <div class="catalog-toolbar">
          <input type="search" id="search-input" placeholder="Buscar producto..." value="${escapeHtml(busqueda)}" />
          <select id="sort-select">
            <option value="az" ${orden === 'az' ? 'selected' : ''}>Nombre A-Z</option>
            <option value="za" ${orden === 'za' ? 'selected' : ''}>Nombre Z-A</option>
            <option value="precio-asc" ${orden === 'precio-asc' ? 'selected' : ''}>Precio ↑</option>
            <option value="precio-desc" ${orden === 'precio-desc' ? 'selected' : ''}>Precio ↓</option>
          </select>
        </div>
        <div class="product-grid">${buildProductCardsHtml(getFilteredProducts())}</div>
      </section>
    </main>
    ${storeFooter()}`;
}

export function bindStoreHome(rerender: () => void): void {
  bindStoreHeaderLogout();

  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      filtroCategoria = Number((btn as HTMLElement).dataset.cat);
      rerender();
    });
  });

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    busqueda = (e.target as HTMLInputElement).value;
    refreshProductGrid();
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    orden = (e.target as HTMLSelectElement).value as typeof orden;
    refreshProductGrid();
  });

  bindProductCards();
}

export function resetStoreFilters(): void {
  filtroCategoria = 0;
  busqueda = '';
  orden = 'az';
}
