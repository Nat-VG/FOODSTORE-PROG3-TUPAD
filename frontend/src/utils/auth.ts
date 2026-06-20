import type { Usuario, UsuarioSesion } from '../types';
import { getUsuarios, addUsuarioMemoria, nextId, getUsuariosMemoria } from './api';

const SESSION_KEY = 'foodstore_user';
const REGISTERED_KEY = 'foodstore_registered';

export function getSession(): UsuarioSesion | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSesion;
  } catch {
    return null;
  }
}

export function setSession(user: UsuarioSesion): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function getRegisteredUsers(): Usuario[] {
  const raw = localStorage.getItem(REGISTERED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Usuario[];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: Usuario[]): void {
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
}

export async function login(mail: string, password: string): Promise<UsuarioSesion | null> {
  const fromJson = await getUsuarios();
  const registered = getRegisteredUsers();
  const all = [...fromJson, ...registered];
  const user = all.find((u) => u.mail === mail && u.password === password);
  if (!user) return null;
  const session: UsuarioSesion = {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    mail: user.mail,
    celular: user.celular,
    rol: user.rol,
  };
  setSession(session);
  return session;
}

export async function register(
  nombre: string,
  mail: string,
  password: string
): Promise<{ ok: true; user: UsuarioSesion } | { ok: false; error: string }> {
  if (password.length < 6) {
    return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return { ok: false, error: 'El email no tiene un formato válido.' };
  }
  const fromJson = await getUsuarios();
  const registered = getRegisteredUsers();
  const all = [...fromJson, ...registered, ...getUsuariosMemoria()];
  if (all.some((u) => u.mail === mail)) {
    return { ok: false, error: 'El email ya está registrado.' };
  }
  const newUser: Usuario = {
    id: nextId([...fromJson, ...registered]),
    nombre,
    apellido: '',
    mail,
    password,
    rol: 'USUARIO',
  };
  registered.push(newUser);
  saveRegisteredUsers(registered);
  addUsuarioMemoria(newUser);
  const session: UsuarioSesion = {
    id: newUser.id,
    nombre: newUser.nombre,
    apellido: newUser.apellido,
    mail: newUser.mail,
    rol: newUser.rol,
  };
  setSession(session);
  return { ok: true, user: session };
}

export function requireAuth(roles?: ('ADMIN' | 'USUARIO')[]): UsuarioSesion | null {
  const session = getSession();
  if (!session) return null;
  if (roles && !roles.includes(session.rol)) return null;
  return session;
}

/** Actualiza nombre/apellido de la sesión desde usuarios.json (evita datos viejos en localStorage). */
export async function syncSessionProfile(): Promise<void> {
  const session = getSession();
  if (!session) return;

  const fromJson = await getUsuarios();
  const registered = getRegisteredUsers();
  const user = [...fromJson, ...registered].find(
    (u) => u.mail === session.mail || u.id === session.id,
  );
  if (!user) return;

  setSession({
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido ?? '',
    mail: user.mail,
    celular: user.celular,
    rol: user.rol,
  });
}
