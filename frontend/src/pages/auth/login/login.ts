import { login } from '../../../utils/auth';
import { navigate, renderDemoCredentials } from '../../../utils/helpers';

export function renderLogin(): string {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Food Store</h1>
        <h2>Iniciar Sesión</h2>
        <form id="login-form">
          <label>Email<input type="email" name="mail" required /></label>
          <label>Contraseña<input type="password" name="password" required /></label>
          <p id="login-error" class="error hidden"></p>
          <button type="submit" class="btn btn-primary">Ingresar</button>
        </form>
        <p class="auth-link">¿No tenés cuenta? <a href="#/register">Registrate</a></p>
        ${renderDemoCredentials()}
      </div>
    </div>`;
}

export function bindLogin(): void {
  const form = document.getElementById('login-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const mail = String(fd.get('mail'));
    const password = String(fd.get('password'));
    const user = await login(mail, password);
    const err = document.getElementById('login-error');
    if (!user) {
      if (err) { err.textContent = 'Credenciales incorrectas.'; err.classList.remove('hidden'); }
      return;
    }
    navigate(user.rol === 'ADMIN' ? '/admin' : '/store');
  });
}
