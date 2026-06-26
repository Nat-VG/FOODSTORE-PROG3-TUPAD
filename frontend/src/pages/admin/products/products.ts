import { getCategorias, getProductos, getProductosMemoria, addProducto, updateProducto, nextId } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { adminShell, bindAdminLogout } from '../adminHome/adminHome';
import { navigate, escapeHtml, formatPrice, productImage } from '../../../utils/helpers';
import type { Producto } from '../../../types';

function productImageValue(prod: Producto): string {
  if (prod.imagen && !prod.imagen.includes('foodish-api.com')) return prod.imagen;
  return `/images/products/${prod.id}.jpg`;
}

function stockCell(stock: number): string {
  if (stock === 0) {
    return `<span class="stock-zero">0</span>`;
  }
  return String(stock);
}

function availabilityBadge(disponible: boolean): string {
  if (disponible) {
    return `<span class="product-status-pill badge-available">Disponible</span>`;
  }
  return `<span class="product-status-pill badge-unavailable">No disponible</span>`;
}

export async function renderAdminProducts(): Promise<string> {
  const session = getSession();
  if (!session || session.rol !== 'ADMIN') { navigate('/login'); return ''; }

  const [productos, categorias] = await Promise.all([getProductos(), getCategorias()]);
  const catMap = new Map(categorias.map((c) => [c.id, c.nombre]));

  const rows = productos.filter((p) => !p.eliminado).map((p) => `
    <tr class="${p.disponible ? '' : 'admin-table-row-unavailable'}">
      <td>${p.id}</td>
      <td><img src="${productImage(p.id, p.imagen)}" class="admin-table-thumb" alt="${escapeHtml(p.nombre)}" loading="lazy" /></td>
      <td>${escapeHtml(p.nombre)}</td>
      <td class="admin-table-desc">${escapeHtml(p.descripcion)}</td>
      <td>${formatPrice(p.precio)}</td>
      <td>${escapeHtml(catMap.get(p.categoriaId) ?? '-')}</td>
      <td>${stockCell(p.stock)}</td>
      <td>${availabilityBadge(p.disponible)}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-table-edit btn-edit" data-id="${p.id}">Editar</button>
        <button type="button" class="btn-table-delete btn-delete" data-id="${p.id}">Eliminar</button>
      </td>
    </tr>`).join('');

  return adminShell('products', `
    <main class="admin-content">
      <div class="admin-page-header">
        <h2 class="admin-page-title">Gestión de Productos</h2>
        <button type="button" id="new-prod" class="btn-admin-new">+ Nuevo Producto</button>
      </div>
      <div class="admin-table-wrap">
        <table class="data-table admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div id="prod-modal" class="modal hidden"></div>
    </main>`);
}

export function bindAdminProducts(rerender: () => void): void {
  bindAdminLogout();

  document.getElementById('new-prod')?.addEventListener('click', () => openModal(null, rerender));

  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number((btn as HTMLElement).dataset.id);
      const prods = await getProductos();
      openModal(prods.find((p) => p.id === id) ?? null, rerender);
    });
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number((btn as HTMLElement).dataset.id);
      if (!confirm('¿Eliminar este producto?')) return;
      const prods = getProductosMemoria();
      const prod = prods.find((p) => p.id === id);
      if (prod) { prod.eliminado = true; updateProducto(prod); rerender(); }
    });
  });
}

function closeProductModal(): void {
  document.getElementById('prod-modal')?.classList.add('hidden');
}

async function openModal(prod: Producto | null, rerender: () => void): Promise<void> {
  const categorias = (await getCategorias()).filter((c) => !c.eliminado);
  const catOptions = categorias.map((c) =>
    `<option value="${c.id}" ${prod?.categoriaId === c.id ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`,
  ).join('');

  const modal = document.getElementById('prod-modal');
  if (!modal) return;

  const imagenValue = prod ? productImageValue(prod) : '';
  const disponibleChecked = prod ? prod.disponible : true;

  modal.innerHTML = `
    <div class="modal-content admin-form-modal admin-form-modal-lg">
      <div class="admin-form-modal-header">
        <h3>${prod ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        <button type="button" id="cancel-prod" class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <form id="prod-form">
        <label>Nombre
          <input name="nombre" required value="${prod ? escapeHtml(prod.nombre) : ''}" />
        </label>
        <label>Descripción
          <textarea name="descripcion" rows="4" required>${prod ? escapeHtml(prod.descripcion) : ''}</textarea>
        </label>
        <label>Precio
          <input name="precio" type="number" min="0.01" step="0.01" required value="${prod?.precio ?? ''}" />
        </label>
        <label>Stock
          <input name="stock" type="number" min="0" required value="${prod?.stock ?? ''}" />
        </label>
        <label>Categoría
          <select name="categoriaId" required>${catOptions}</select>
        </label>
        <label>URL de Imagen
          <input name="imagen" placeholder="https://ejemplo.com/imagen.jpg" value="${escapeHtml(imagenValue)}" />
        </label>
        <label class="admin-form-checkbox">
          <input type="checkbox" name="disponible" ${disponibleChecked ? 'checked' : ''} />
          <span>Producto disponible</span>
        </label>
        <button type="submit" class="btn-admin-save">Guardar</button>
      </form>
    </div>`;
  modal.classList.remove('hidden');

  document.getElementById('cancel-prod')?.addEventListener('click', closeProductModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProductModal();
  }, { once: true });

  document.getElementById('prod-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const precio = Number(fd.get('precio'));
    const stock = Number(fd.get('stock'));
    if (precio <= 0 || stock < 0) { alert('Precio > 0 y stock >= 0'); return; }

    const imagen = String(fd.get('imagen') || '').trim();
    const prods = getProductosMemoria();
    const data = {
      nombre: String(fd.get('nombre')),
      descripcion: String(fd.get('descripcion')),
      precio,
      stock,
      categoriaId: Number(fd.get('categoriaId')),
      imagen: imagen || undefined,
      disponible: fd.get('disponible') === 'on',
      eliminado: false,
    };

    if (prod) {
      updateProducto({
        ...prod,
        ...data,
        imagen: imagen || productImageValue(prod),
      });
    } else {
      const newId = nextId(prods);
      addProducto({
        id: newId,
        ...data,
        imagen: imagen || `/images/products/${newId}.jpg`,
      });
    }
    closeProductModal();
    rerender();
  });
}
