import type { Categoria, Pedido, Producto, Usuario } from '../types';

/**
 * Capa de datos aislada. Hoy consume JSON locales; en la iteración
 * siguiente se reemplazan las URLs por endpoints REST (ej: /api/products).
 */

let categoriasCache: Categoria[] | null = null;
let productosCache: Producto[] | null = null;
let usuariosCache: Usuario[] | null = null;
let pedidosCache: Pedido[] | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Error al cargar ${url}`);
  return response.json() as Promise<T>;
}

export async function getCategorias(): Promise<Categoria[]> {
  if (!categoriasCache) {
    categoriasCache = await fetchJson<Categoria[]>('/data/categorias.json');
  }
  return [...categoriasCache];
}

export async function getProductos(): Promise<Producto[]> {
  if (!productosCache) {
    productosCache = await fetchJson<Producto[]>('/data/productos.json');
  }
  return [...productosCache];
}

export async function getUsuarios(): Promise<Usuario[]> {
  if (!usuariosCache) {
    usuariosCache = await fetchJson<Usuario[]>('/data/usuarios.json');
  }
  return [...usuariosCache];
}

export async function getPedidos(): Promise<Pedido[]> {
  if (!pedidosCache) {
    pedidosCache = await fetchJson<Pedido[]>('/data/pedidos.json');
  }
  return [...pedidosCache];
}

/** Estado en memoria para operaciones de escritura (no persisten en JSON). */
export function getCategoriasMemoria(): Categoria[] {
  if (!categoriasCache) throw new Error('Datos no cargados');
  return categoriasCache;
}

export function getProductosMemoria(): Producto[] {
  if (!productosCache) throw new Error('Datos no cargados');
  return productosCache;
}

export function getPedidosMemoria(): Pedido[] {
  if (!pedidosCache) throw new Error('Datos no cargados');
  return pedidosCache;
}

export function getUsuariosMemoria(): Usuario[] {
  if (!usuariosCache) throw new Error('Datos no cargados');
  return usuariosCache;
}

export async function initData(): Promise<void> {
  await Promise.all([getCategorias(), getProductos(), getUsuarios(), getPedidos()]);
}

export function addCategoria(categoria: Categoria): void {
  getCategoriasMemoria().push(categoria);
}

export function updateCategoria(categoria: Categoria): void {
  const list = getCategoriasMemoria();
  const idx = list.findIndex((c) => c.id === categoria.id);
  if (idx >= 0) list[idx] = categoria;
}

export function addProducto(producto: Producto): void {
  getProductosMemoria().push(producto);
}

export function updateProducto(producto: Producto): void {
  const list = getProductosMemoria();
  const idx = list.findIndex((p) => p.id === producto.id);
  if (idx >= 0) list[idx] = producto;
}

export function addPedido(pedido: Pedido): void {
  getPedidosMemoria().push(pedido);
}

export function updatePedido(pedido: Pedido): void {
  const list = getPedidosMemoria();
  const idx = list.findIndex((p) => p.id === pedido.id);
  if (idx >= 0) list[idx] = pedido;
}

export function addUsuarioMemoria(usuario: Usuario): void {
  getUsuariosMemoria().push(usuario);
}

export function nextId(items: { id: number }[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}
