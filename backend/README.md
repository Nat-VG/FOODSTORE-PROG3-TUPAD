# Food Store JPA — Backend (Parte 2)

Backend de consola con Java 21, JPA/Hibernate 6 y base de datos H2 en archivo.

## Tecnologías

- Java 21
- JPA / Hibernate 6.4.4
- H2 (base de datos en `./data/jpa_db`)
- Lombok
- Gradle 8.5

## Estructura

```
src/main/java/com/tp/jpa/
├── model/          # Entidades JPA (no modificar)
├── repository/     # CRUD + consultas JPQL personalizadas
├── util/           # JPAUtil
└── Main.java       # Menú de consola
```

## Cómo ejecutar

Desde esta carpeta:

```powershell
.\gradlew.bat run
```

La salida de Gradle usa modo `plain` (sin barra `EXECUTING`). Si preferís pasarlo solo en la terminal: `.\gradlew.bat run --console=plain`.

O compilar y ejecutar el JAR:

```powershell
.\gradlew.bat jar
java -jar build\libs\foodstore-backend-1.0.0.jar
```

La base de datos H2 se crea automáticamente en `./data/jpa_db.mv.db` al primer arranque.

## Carga de datos

Al primer arranque, si la base está vacía, `DataSeeder.seedIfEmpty()` carga categorías, productos, usuarios y pedidos de demostración.

También podés crear datos manualmente desde el menú en este orden:

1. Categorías
2. Productos (requieren categoría existente)
3. Usuarios
4. Pedidos (requieren usuario y productos con stock)

## Funcionalidades implementadas

| Módulo | Operaciones |
|---|---|
| Categorías | Alta, modificar, baja lógica, listado |
| Productos | Alta (con categoría), modificar, baja lógica, listado |
| Usuarios | Alta (mail único), modificar, baja lógica, listado, búsqueda por mail |
| Pedidos | Alta atómica, cambio de estado, baja lógica, listados, filtros |
| Reportes | Productos por categoría, pedidos por usuario/estado, total facturado |

## Consultas JPQL personalizadas

- `ProductoRepository.buscarPorCategoria()` — JOIN desde Categoria
- `UsuarioRepository.buscarPorMail()` — retorna Optional
- `PedidoRepository.buscarPorUsuario()` — JOIN desde Usuario
- `PedidoRepository.buscarPorEstado()` — filtro por enum EstadoPedido

## Alta de pedido

El alta de pedido se ejecuta en una **única transacción atómica**: valida stock y disponibilidad, crea detalles, calcula total, reduce inventario y persiste. Ante cualquier error se hace rollback completo.
