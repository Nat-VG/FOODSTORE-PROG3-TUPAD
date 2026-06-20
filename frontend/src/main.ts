import './style.css';
import { initData } from './utils/api';
import { getRoute, navigate } from './utils/helpers';
import { getSession, syncSessionProfile } from './utils/auth';
import { renderLogin, bindLogin } from './pages/auth/login/login';
import { renderRegister, bindRegister } from './pages/auth/register/register';
import { renderStoreHome, bindStoreHome } from './pages/store/home/home';
import { renderProductDetail, bindProductDetail } from './pages/store/productDetail/productDetail';
import { renderCart, bindCart } from './pages/store/cart/cart';
import { renderClientOrders, bindClientOrders } from './pages/client/orders/orders';
import { renderAdminHome, bindAdminLogout } from './pages/admin/adminHome/adminHome';
import { renderAdminCategories, bindAdminCategories } from './pages/admin/categories/categories';
import { renderAdminProducts, bindAdminProducts } from './pages/admin/products/products';
import { renderAdminOrders, bindAdminOrders } from './pages/admin/orders/orders';

const app = document.getElementById('app')!;

async function render(): Promise<void> {
  await initData();
  await syncSessionProfile();
  const route = getRoute();

  if (route === '/' || route === '/login') {
    const session = getSession();
    if (session) {
      navigate(session.rol === 'ADMIN' ? '/admin' : '/store');
      return;
    }
    app.innerHTML = renderLogin();
    bindLogin();
    return;
  }

  if (route === '/register') {
    app.innerHTML = renderRegister();
    bindRegister();
    return;
  }

  if (route === '/store') {
    app.innerHTML = await renderStoreHome();
    bindStoreHome(render);
    return;
  }

  if (route.startsWith('/product/')) {
    const id = route.split('/')[2];
    app.innerHTML = await renderProductDetail(id);
    bindProductDetail(id);
    return;
  }

  if (route === '/cart') {
    app.innerHTML = await renderCart();
    bindCart(render);
    return;
  }

  if (route === '/orders') {
    app.innerHTML = await renderClientOrders();
    bindClientOrders();
    return;
  }

  if (route === '/admin') {
    app.innerHTML = await renderAdminHome();
    bindAdminLogout();
    return;
  }

  if (route === '/admin/categories') {
    app.innerHTML = await renderAdminCategories();
    bindAdminCategories(render);
    return;
  }

  if (route === '/admin/products') {
    app.innerHTML = await renderAdminProducts();
    bindAdminProducts(render);
    return;
  }

  if (route === '/admin/orders') {
    app.innerHTML = await renderAdminOrders();
    bindAdminOrders(render);
    return;
  }

  navigate('/login');
}

window.addEventListener('hashchange', () => { render(); });
render();
