# Food Store — Frontend (Parte 1)

Interfaz web del sistema Food Store con TypeScript y Vite. Consume datos desde archivos JSON locales mediante `fetch()`.

## Tecnologías

- TypeScript
- Vite 6
- HTML5 / CSS3

## Instalación y ejecución

```powershell
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@admin.com | 123456 |
| Cliente | cliente@food.com | cliente123 |

## Configuración

- **Costo de envío:** `ENVIO = 0` (definido en `src/utils/config.ts`)
- **Total del pedido:** subtotal + envío

## Estructura

```
src/
├── types/          # Tipos TypeScript
├── utils/          # api.ts (fetch), auth.ts, cart.ts, config.ts
└── pages/          # auth, store, client, admin
public/
├── data/           # JSON (categorias, productos, usuarios, pedidos)
└── images/         # Imágenes locales (products/, categorias/)
```

## Capa de datos

Las funciones en `src/utils/api.ts` centralizan el acceso a datos:

```typescript
// Hoy: fetch('/data/productos.json')
// Futuro: fetch('/api/products')
```

Para integrar el backend Java, reemplazar las URLs en `api.ts` por los endpoints REST correspondientes.

## Notas

- Login verifica credenciales contra `usuarios.json`
- Registro agrega usuarios en memoria (localStorage) — no persiste en el JSON
- CRUD admin y pedidos del cliente operan en memoria; al recargar la página se restauran los datos del JSON
- Solo productos con `disponible=true` y `eliminado=false` aparecen en el catálogo
