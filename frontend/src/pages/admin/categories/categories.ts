import { getCategorias, getCategoriasMemoria, addCategoria, updateCategoria, nextId } from '../../../utils/api';
import { getSession } from '../../../utils/auth';
import { adminShell, bindAdminLogout } from '../adminHome/adminHome';
import { navigate, escapeHtml } from '../../../utils/helpers';
import type { Categoria } from '../../../types';

function categoryImageSrc(cat: Categoria): string {
  if (cat.imagen && !cat.imagen.includes('foodish-api.com')) return cat.imagen;
  return `/images/categorias/${cat.id}.jpg`;
}

export async function renderAdminCategories(): Promise<string> {
  const session = getSession();
  if (!session || session.rol !== 'ADMIN') { navigate('/login'); return ''; }

  const categorias = await getCategorias();
  const rows = categorias.filter((c) => !c.eliminado).map((c) => `
    <tr>
      <td>${c.id}</td>
      <td><img src="${categoryImageSrc(c)}" class="admin-table-thumb" alt="${escapeHtml(c.nombre)}" loading="lazy" /></td>
      <td>${escapeHtml(c.nombre)}</td>
      <td>${escapeHtml(c.descripcion)}</td>
      <td class="admin-table-actions">
        <button type="button" class="btn-table-edit btn-edit" data-id="${c.id}">Editar</button>
        <button type="button" class="btn-table-delete btn-delete" data-id="${c.id}">Eliminar</button>
      </td>
    </tr>`).join('');

  return adminShell('categories', `
    <main class="admin-content">
      <div class="admin-page-header">
        <h2 class="admin-page-title">Gestión de Categorías</h2>
        <button type="button" id="new-cat" class="btn-admin-new">+ Nueva Categoría</button>
      </div>
      <div class="admin-table-wrap">
        <table class="data-table admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div id="cat-modal" class="modal hidden"></div>
    </main>`);
}

export function bindAdminCategories(rerender: () => void): void {
  bindAdminLogout();

  document.getElementById('new-cat')?.addEventListener('click', () => openModal(null, rerender));

  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number((btn as HTMLElement).dataset.id);
      const cats = await getCategorias();
      const cat = cats.find((c) => c.id === id);
      openModal(cat ?? null, rerender);
    });
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number((btn as HTMLElement).dataset.id);
      if (!confirm('¿Eliminar esta categoría?')) return;
      const cats = getCategoriasMemoria();
      const cat = cats.find((c) => c.id === id);
      if (cat) { cat.eliminado = true; updateCategoria(cat); rerender(); }
    });
  });
}

function closeCategoryModal(): void {
  document.getElementById('cat-modal')?.classList.add('hidden');
}

function openModal(cat: Categoria | null, rerender: () => void): void {
  const modal = document.getElementById('cat-modal');
  if (!modal) return;

  const imagenValue = cat?.imagen && !cat.imagen.includes('foodish-api.com')
    ? cat.imagen
    : (cat ? categoryImageSrc(cat) : '');

  modal.innerHTML = `
    <div class="modal-content admin-form-modal">
      <div class="admin-form-modal-header">
        <h3>${cat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
        <button type="button" id="cancel-cat" class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <form id="cat-form">
        <label>Nombre
          <input name="nombre" required value="${cat ? escapeHtml(cat.nombre) : ''}" />
        </label>
        <label>Descripción
          <textarea name="descripcion" rows="4" required>${cat ? escapeHtml(cat.descripcion) : ''}</textarea>
        </label>
        <label>URL de Imagen
          <input name="imagen" placeholder="https://ejemplo.com/imagen.jpg" value="${escapeHtml(imagenValue)}" />
        </label>
        <button type="submit" class="btn-admin-save">Guardar</button>
      </form>
    </div>`;
  modal.classList.remove('hidden');

  document.getElementById('cancel-cat')?.addEventListener('click', closeCategoryModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCategoryModal();
  }, { once: true });

  document.getElementById('cat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const cats = getCategoriasMemoria();
    const imagen = String(fd.get('imagen') || '').trim();
    if (cat) {
      cat.nombre = String(fd.get('nombre'));
      cat.descripcion = String(fd.get('descripcion'));
      cat.imagen = imagen || categoryImageSrc(cat);
      updateCategoria(cat);
    } else {
      const newId = nextId(cats);
      addCategoria({
        id: newId,
        nombre: String(fd.get('nombre')),
        descripcion: String(fd.get('descripcion')),
        imagen: imagen || `/images/categorias/${newId}.jpg`,
        eliminado: false,
      });
    }
    closeCategoryModal();
    rerender();
  });
}
