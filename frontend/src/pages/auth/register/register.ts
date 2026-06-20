import { register } from '../../../utils/auth';
import { navigate, renderDemoCredentials } from '../../../utils/helpers';

export function renderRegister(): string {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Food Store</h1>
        <h2>Registro de Cliente</h2>
        <form id="register-form">
          <label>Nombre<input type="text" name="nombre" required /></label>
          <label>Email<input type="email" name="mail" required /></label>
          <label>Contraseña (mín. 6)<input type="password" name="password" required minlength="6" /></label>
          <p id="register-error" class="error hidden"></p>
          <button type="submit" class="btn btn-primary">Registrarse</button>
        </form>
        <p class="auth-link">¿Ya tenés cuenta? <a href="#/login">Iniciar sesión</a></p>
        ${renderDemoCredentials()}
      </div>
    </div>`;
}

export function bindRegister(): void {
  const form = document.getElementById('register-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const result = await register(
      String(fd.get('nombre')),
      String(fd.get('mail')),
      String(fd.get('password'))
    );
    const err = document.getElementById('register-error');
    if (!result.ok) {
      if (err) { err.textContent = result.error; err.classList.remove('hidden'); }
      return;
    }
    navigate('/store');
  });
}
