import { getProductos } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { addToCart, updateCartBadge } from '../../../utils/cart';
import { navigate, formatPrice, escapeHtml, showToast, storeFooter, productImage, renderStoreHeader, bindStoreHeaderLogout } from '../../../utils/helpers';

function productStatus(producto: { disponible: boolean; stock: number }): { className: string; label: string } {
  if (producto.stock === 0) {
    return { className: 'product-status status-outofstock', label: 'Sin stock' };
  }
  if (producto.disponible) {
    return { className: 'product-status status-available', label: 'Disponible' };
  }
  return { className: 'product-status status-unavailable', label: 'No disponible' };
}

export async function renderProductDetail(id: string): Promise<string> {
  const session = getSession();
  if (!session) { navigate('/login'); return ''; }

  const productos = await getProductos();
  const producto = productos.find((p) => p.id === Number(id));
  if (!producto || producto.eliminado) {
    return `<main class="page"><p>Producto no encontrado.</p><a href="#/store">Volver</a></main>`;
  }

  const disabled = !producto.disponible || producto.stock === 0;
  const status = productStatus(producto);

  return `
    ${renderStoreHeader()}
    <main class="page product-detail-page">
      <article class="product-detail-card">
        <div class="product-detail-media">
          <img src="${productImage(producto.id, producto.imagen)}" alt="${escapeHtml(producto.nombre)}" loading="lazy" />
        </div>
        <div class="product-detail-body">
          <div class="product-detail-head">
            <h1>${escapeHtml(producto.nombre)}</h1>
            <span class="${status.className}">${status.label}</span>
          </div>
          <p class="product-detail-price">${formatPrice(producto.precio)}</p>
          <div class="product-detail-meta">
            <div class="stock-oval" title="Unidades disponibles">
              <span class="stock-oval-label">Stock</span>
              <span class="stock-oval-value">${producto.stock}</span>
            </div>
          </div>
          <section class="product-description-box">
            <h2>Descripción</h2>
            <p>${escapeHtml(producto.descripcion)}</p>
          </section>
          <div class="product-purchase">
            <label class="qty-label">Cantidad
              <input type="number" id="qty-input" class="qty-input" min="1" max="${producto.stock}" value="1" ${disabled ? 'disabled' : ''} />
            </label>
            <button id="add-cart-btn" class="btn btn-primary btn-add-cart" ${disabled ? 'disabled' : ''}>Agregar al Carrito</button>
          </div>
          <p id="detail-msg" class="success hidden">Producto agregado al carrito.</p>
        </div>
      </article>
    </main>
    ${storeFooter()}`;
}

export function bindProductDetail(id: string): void {
  bindStoreHeaderLogout();

  document.getElementById('add-cart-btn')?.addEventListener('click', async () => {
    const productos = await getProductos();
    const producto = productos.find((p) => p.id === Number(id));
    if (!producto) return;
    const qty = Number((document.getElementById('qty-input') as HTMLInputElement).value);
    if (qty <= 0 || qty > producto.stock) return;
    const ok = addToCart({
      idProducto: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: productImage(producto.id, producto.imagen),
      stock: producto.stock,
    }, qty);
    if (ok) {
      updateCartBadge();
      showToast('Producto agregado al carrito');
      const msg = document.getElementById('detail-msg');
      if (msg) msg.classList.remove('hidden');
    }
  });
}
