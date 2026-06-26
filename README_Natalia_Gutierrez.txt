TPI PROGRAMACION III - FOOD STORE
Autora: Natalia Gutierrez

Descripcion
Este proyecto corresponde al Trabajo Practico Integrador de Programacion III.
La solucion incluye:
- Frontend en TypeScript + Vite (SPA)
- Backend en Java 21 + JPA/Hibernate + H2 (consola)

Estructura principal
- frontend/
- backend/

Ejecucion del backend
1) Abrir terminal en la carpeta backend
2) Ejecutar:
   .\gradlew.bat run

Ejecucion del frontend
1) Abrir otra terminal en la carpeta frontend
2) Ejecutar:
   npm install
   npm run dev
3) Abrir:
   http://localhost:5173

Credenciales de prueba
- Admin:
  admin@admin.com
  123456

- Cliente:
  cliente@food.com
  cliente123

Notas tecnicas relevantes
- El frontend consume datos desde JSON en public/data mediante fetch().
- El backend implementa CRUD generico, soft delete y consultas JPQL.
- El alta de pedido en backend es atomica con rollback ante error.
- En frontend se aplican validaciones de stock en detalle/carrito y checkout.

Estado de entrega
- El ZIP de entrega contiene solo las carpetas frontend/ y backend/.
- Este archivo README y el guion de video se dejan fuera del ZIP por decision de entrega.

Firma
Natalia Gutierrez
