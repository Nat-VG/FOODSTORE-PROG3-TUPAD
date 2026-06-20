package com.tp.jpa;

import com.tp.jpa.model.*;
import com.tp.jpa.model.enums.EstadoPedido;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.PedidoRepository;
import com.tp.jpa.repository.ProductoRepository;
import com.tp.jpa.repository.UsuarioRepository;
import com.tp.jpa.util.DataSeeder;
import com.tp.jpa.util.JPAUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Scanner;

public class Main {

    private static final String LINE = "============================================================";
    private static final String SUB  = "------------------------------------------------------------";

    private static final Scanner sc = new Scanner(System.in);
    private static final EntityManagerFactory emf = JPAUtil.getEntityManagerFactory();

    private static final CategoriaRepository categoriaRepo = new CategoriaRepository();
    private static final ProductoRepository productoRepo = new ProductoRepository();
    private static final UsuarioRepository usuarioRepo = new UsuarioRepository();
    private static final PedidoRepository pedidoRepo = new PedidoRepository();

    private record ItemPedidoTemp(Long productoId, int cantidad) {}

    public static void main(String[] args) {
        try {
            DataSeeder.seedIfEmpty();
            menuPrincipal();
        } finally {
            JPAUtil.close();
        }
    }
    private static void menuPrincipal() {
        boolean salir = false;
        while (!salir) {
            header("MENU PRINCIPAL");
            System.out.println("  1. Gestion de Categorias");
            System.out.println("  2. Gestion de Productos");
            System.out.println("  3. Gestion de Usuarios");
            System.out.println("  4. Gestion de Pedidos");
            System.out.println("  5. Reportes");
            System.out.println("  0. Salir");
            System.out.println(LINE);
            String op = leerOpcion();
            switch (op) {
                case "1" -> menuCategorias();
                case "2" -> menuProductos();
                case "3" -> menuUsuarios();
                case "4" -> menuPedidos();
                case "5" -> menuReportes();
                case "0" -> salir = true;
                default  -> opcionInvalida();
            }
        }
        System.out.println();
        System.out.println(LINE);
        System.out.println(" Fin de la demostracion. Gracias por su atencion.");
        System.out.println(LINE);
    }
    private static void menuCategorias() {
        boolean volver = false;
        while (!volver) {
            header("GESTION DE CATEGORIAS");
            System.out.println("  1. Alta de categoria");
            System.out.println("  2. Listar categorias activas");
            System.out.println("  3. Modificar categoria");
            System.out.println("  4. Baja logica de categoria");
            System.out.println("  0. Volver al menu principal");
            System.out.println(LINE);
            String op = leerOpcion();
            switch (op) {
                case "1" -> altaCategoria();
                case "2" -> listarCategorias();
                case "3" -> modificarCategoria();
                case "4" -> bajaCategoria();
                case "0" -> volver = true;
                default  -> opcionInvalida();
            }
        }
    }

    private static void altaCategoria() {
        subheader("ALTA DE CATEGORIA");
        System.out.print("  Nombre       : ");
        String nombre = sc.nextLine().trim();
        if (nombre.isEmpty()) {
            error("El nombre no puede estar vacio. Operacion cancelada.");
            pausa();
            return;
        }
        System.out.print("  Descripcion  : ");
        String descripcion = sc.nextLine().trim();

        Categoria c = new Categoria();
        c.setNombre(nombre);
        c.setDescripcion(descripcion);
        Categoria guardada = categoriaRepo.guardar(c);

        ok("Categoria creada correctamente.");
        System.out.println("       ID asignado : " + guardada.getId());
        System.out.println("       Nombre      : " + guardada.getNombre());
        pausa();
    }

    private static void modificarCategoria() {
        subheader("MODIFICAR CATEGORIA");
        List<Categoria> activas = categoriaRepo.listarActivos();
        if (activas.isEmpty()) {
            info("No hay categorias activas para modificar.");
            pausa();
            return;
        }
        mostrarCategorias(activas);
        Long id = leerLong("  ID de la categoria a modificar: ");
                Optional<Categoria> opt = categoriaRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("La categoria no existe o esta dada de baja.");
            pausa();
            return;
        }
        Categoria c = opt.get();
        System.out.println();
        System.out.println("  Valores actuales:");
        System.out.println("       Nombre      : " + c.getNombre());
        System.out.println("       Descripcion : " + c.getDescripcion());
        System.out.println();
        System.out.println("  (Deje vacio y ENTER para conservar el valor actual)");

        System.out.print("  Nuevo nombre      : ");
        String nuevoNombre = sc.nextLine();
        if (nuevoNombre != null && !nuevoNombre.trim().isEmpty()) {
            c.setNombre(nuevoNombre.trim());
        }
        System.out.print("  Nueva descripcion : ");
        String nuevaDesc = sc.nextLine();
        if (nuevaDesc != null && !nuevaDesc.trim().isEmpty()) {
            c.setDescripcion(nuevaDesc.trim());
        }
        categoriaRepo.guardar(c);
        ok("Categoria actualizada correctamente.");
        System.out.println("       ID          : " + c.getId());
        System.out.println("       Nombre      : " + c.getNombre());
        System.out.println("       Descripcion : " + c.getDescripcion());
        pausa();
    }

    private static void bajaCategoria() {
        subheader("BAJA LOGICA DE CATEGORIA");
        List<Categoria> activas = categoriaRepo.listarActivos();
        if (activas.isEmpty()) {
            info("No hay categorias activas para dar de baja.");
            pausa();
            return;
        }
        mostrarCategorias(activas);
        Long id = leerLong("  ID de la categoria a dar de baja: ");
                Optional<Categoria> opt = categoriaRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("La categoria no existe o ya esta dada de baja.");
            pausa();
            return;
        }
        String nombre = opt.get().getNombre();
        if (categoriaRepo.eliminarLogico(id)) {
            ok("Categoria '" + nombre + "' dada de baja correctamente.");
        } else {
            error("No se pudo dar de baja la categoria.");
        }
        pausa();
    }

    private static void listarCategorias() {
        subheader("LISTADO DE CATEGORIAS ACTIVAS");
        List<Categoria> activas = categoriaRepo.listarActivos();
        if (activas.isEmpty()) {
            info("No hay categorias activas.");
        } else {
            mostrarCategorias(activas);
            System.out.println("  Total: " + activas.size() + " categoria(s) activa(s).");
        }
        pausa();
    }

    private static void mostrarCategorias(List<Categoria> categorias) {
        System.out.println();
        System.out.printf("  %-5s | %-25s | %-40s%n", "ID", "NOMBRE", "DESCRIPCION");
        System.out.println("  " + SUB);
        for (Categoria c : categorias) {
            System.out.printf("  %-5d | %-25s | %-40s%n",
                    c.getId(),
                    safe(c.getNombre(), 25),
                    safe(c.getDescripcion(), 40));
        }
        System.out.println();
    }

    private static void menuProductos() {
        boolean volver = false;
        while (!volver) {
            header("GESTION DE PRODUCTOS");
            System.out.println("  1. Alta de producto");
            System.out.println("  2. Modificar producto");
            System.out.println("  3. Baja logica de producto");
            System.out.println("  4. Listar productos activos");
            System.out.println("  0. Volver al menu principal");
            System.out.println(LINE);
            String op = leerOpcion();
            switch (op) {
                case "1" -> altaProducto();
                case "2" -> modificarProducto();
                case "3" -> bajaProducto();
                case "4" -> listarProductos();
                case "0" -> volver = true;
                default  -> opcionInvalida();
            }
        }
    }

    private static void altaProducto() {
        subheader("ALTA DE PRODUCTO");
        List<Categoria> categorias = categoriaRepo.listarActivos();
        if (categorias.isEmpty()) {
            info("No hay categorias activas. Cree una categoria primero.");
            pausa();
            return;
        }
        System.out.println("  Categorias disponibles:");
        mostrarCategorias(categorias);

        Long catId = leerLong("  ID de la categoria del producto: ");

        Optional<Categoria> optCat = categoriaRepo.buscarPorId(catId);
        if (optCat.isEmpty() || optCat.get().isEliminado()) {
            error("La categoria no existe o esta dada de baja.");
            pausa();
            return;
        }

        String nombre = leerLinea("  Nombre del producto : ");
        if (nombre.isEmpty()) {
            error("El nombre no puede estar vacio. Operacion cancelada.");
            pausa();
            return;
        }

        String descripcion = leerLinea("  Descripcion         : ");

        Double precio = leerDouble("  Precio (mayor a 0)  : ");
        if (precio <= 0) {
            error("El precio debe ser mayor a 0. Operacion cancelada.");
            pausa();
            return;
        }

        int stock = leerInt("  Stock (>= 0)        : ");
        if (stock < 0) {
            error("El stock no puede ser negativo. Operacion cancelada.");
            pausa();
            return;
        }

        String imagen = leerLinea("  Imagen (URL, opcional): ");
        boolean disponible = leerSiNo("  Disponible?", true);

        Producto producto = Producto.builder()
                .nombre(nombre)
                .descripcion(descripcion.isEmpty() ? null : descripcion)
                .precio(precio)
                .stock(stock)
                .imagen(imagen.isEmpty() ? null : imagen)
                .disponible(disponible)
                .build();

        Categoria categoria = optCat.get();
        categoria.addProducto(producto);
        categoriaRepo.guardar(categoria);

        ok("Producto creado correctamente.");
        System.out.println("       ID asignado : " + producto.getId());
        System.out.println("       Nombre      : " + producto.getNombre());
        System.out.println("       Precio      : $" + producto.getPrecio());
        System.out.println("       Stock       : " + producto.getStock());
        System.out.println("       Disponible  : " + (producto.getDisponible() ? "Si" : "No"));
        System.out.println("       Categoria   : " + categoria.getNombre());
        pausa();
    }

    private static void modificarProducto() {
        subheader("MODIFICAR PRODUCTO");
        List<Producto> activos = productoRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay productos activos para modificar.");
            pausa();
            return;
        }
        mostrarProductos(activos);
        Long id = leerLong("  ID del producto a modificar: ");
                Optional<Producto> opt = productoRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("El producto no existe o esta dado de baja.");
            pausa();
            return;
        }
        Producto p = opt.get();
        System.out.println();
        System.out.println("  Valores actuales:");
        System.out.println("       Nombre : " + p.getNombre());
        System.out.println("       Precio : $" + p.getPrecio());
        System.out.println("       Stock  : " + p.getStock());
        System.out.println();
        System.out.println("  (Deje vacio y ENTER para conservar el valor actual)");

        System.out.print("  Nuevo nombre : ");
        String nuevoNombre = sc.nextLine();
        if (nuevoNombre != null && !nuevoNombre.trim().isEmpty()) {
            p.setNombre(nuevoNombre.trim());
        }

        System.out.print("  Nuevo precio : ");
        String precioStr = sc.nextLine();
        if (precioStr != null && !precioStr.trim().isEmpty()) {
            try {
                double nuevoPrecio = Double.parseDouble(precioStr.trim());
                if (nuevoPrecio <= 0) {
                    error("El precio debe ser mayor a 0. Se conserva el valor anterior.");
                } else {
                    p.setPrecio(nuevoPrecio);
                }
            } catch (NumberFormatException e) {
                error("Precio invalido. Se conserva el valor anterior.");
            }
        }

        System.out.print("  Nuevo stock  : ");
        String stockStr = sc.nextLine();
        if (stockStr != null && !stockStr.trim().isEmpty()) {
            try {
                int nuevoStock = Integer.parseInt(stockStr.trim());
                if (nuevoStock < 0) {
                    error("El stock no puede ser negativo. Se conserva el valor anterior.");
                } else {
                    p.setStock(nuevoStock);
                }
            } catch (NumberFormatException e) {
                error("Stock invalido. Se conserva el valor anterior.");
            }
        }

        productoRepo.guardar(p);
        ok("Producto actualizado correctamente.");
        System.out.println("       ID     : " + p.getId());
        System.out.println("       Nombre : " + p.getNombre());
        System.out.println("       Precio : $" + p.getPrecio());
        System.out.println("       Stock  : " + p.getStock());
        pausa();
    }

    private static void bajaProducto() {
        subheader("BAJA LOGICA DE PRODUCTO");
        List<Producto> activos = productoRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay productos activos para dar de baja.");
            pausa();
            return;
        }
        mostrarProductos(activos);
        Long id = leerLong("  ID del producto a dar de baja: ");
                Optional<Producto> opt = productoRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("El producto no existe o ya esta dado de baja.");
            pausa();
            return;
        }
        String nombre = opt.get().getNombre();
        boolean exito = productoRepo.eliminarLogico(id);
        if (exito) {
            ok("Producto '" + nombre + "' dado de baja correctamente.");
        } else {
            error("No se pudo dar de baja el producto.");
        }
        pausa();
    }

    private static void listarProductos() {
        subheader("LISTADO DE PRODUCTOS ACTIVOS");
        List<Producto> activos = productoRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay productos activos.");
        } else {
            mostrarProductos(activos);
            System.out.println("  Total: " + activos.size() + " producto(s) activo(s).");
        }
        pausa();
    }

    private static void mostrarProductos(List<Producto> productos) {
        System.out.println();
        System.out.printf("  %-5s | %-22s | %-10s | %-6s | %-8s | %-18s%n",
                "ID", "NOMBRE", "PRECIO", "STOCK", "DISP.", "CATEGORIA");
        System.out.println("  " + SUB);
        for (Producto p : productos) {
            String nombreCat = resolverCategoriaDeProducto(p.getId());
            double precio = p.getPrecio() != null ? p.getPrecio() : 0.0;
            String disp = Boolean.TRUE.equals(p.getDisponible()) ? "Si" : "No";
            System.out.printf("  %-5d | %-22s | $%-9.2f | %-6d | %-8s | %-18s%n",
                    p.getId(),
                    safe(p.getNombre(), 22),
                    precio,
                    p.getStock(),
                    disp,
                    safe(nombreCat, 18));
        }
        System.out.println();
    }


    private static void menuUsuarios() {
        boolean volver = false;
        while (!volver) {
            header("GESTION DE USUARIOS");
            System.out.println("  1. Alta de usuario");
            System.out.println("  2. Modificar usuario");
            System.out.println("  3. Baja logica de usuario");
            System.out.println("  4. Listar usuarios activos");
            System.out.println("  5. Buscar por mail");
            System.out.println("  0. Volver al menu principal");
            System.out.println(LINE);
            String op = leerOpcion();
            switch (op) {
                case "1" -> altaUsuario();
                case "2" -> modificarUsuario();
                case "3" -> bajaUsuario();
                case "4" -> listarUsuarios();
                case "5" -> buscarUsuarioPorMail();
                case "0" -> volver = true;
                default  -> opcionInvalida();
            }
        }
    }

    private static void altaUsuario() {
        subheader("ALTA DE USUARIO");
        String nombre = leerLinea("  Nombre   : ");
        String apellido = leerLinea("  Apellido : ");
        String mail = leerLinea("  Mail     : ");
        if (usuarioRepo.buscarPorMail(mail).isPresent()) {
            error("Ya existe un usuario activo con ese mail.");
            pausa();
            return;
        }
        String celular = leerLinea("  Celular (opcional): ");
        String contrasena = leerLinea("  Contrasena: ");
        Rol rol = seleccionarRol();

        Usuario usuario = Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .mail(mail)
                .celular(celular.isEmpty() ? null : celular)
                .contraseña(contrasena)
                .rol(rol)
                .build();
        Usuario guardado = usuarioRepo.guardar(usuario);
        ok("Usuario creado correctamente.");
        System.out.println("       ID asignado : " + guardado.getId());
        System.out.println("       Nombre      : " + nombreCompletoUsuario(guardado));
        pausa();
    }

    private static void modificarUsuario() {
        subheader("MODIFICAR USUARIO");
        List<Usuario> activos = usuarioRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay usuarios activos para modificar.");
            pausa();
            return;
        }
        mostrarUsuariosTabla(activos);
        Long id = leerLong("  ID del usuario a modificar: ");

        Optional<Usuario> opt = usuarioRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("El usuario no existe o esta dado de baja.");
            pausa();
            return;
        }
        Usuario u = opt.get();
        System.out.println();
        System.out.println("  Valores actuales:");
        System.out.println("       Nombre  : " + u.getNombre());
        System.out.println("       Apellido: " + u.getApellido());
        System.out.println("       Mail    : " + u.getMail());
        System.out.println("       Celular : " + (u.getCelular() != null ? u.getCelular() : "-"));
        System.out.println();
        System.out.println("  (Deje vacio y ENTER para conservar el valor actual)");

        u.setNombre(conservarSiVacio(u.getNombre(), leerLinea("  Nuevo nombre  : ")));
        u.setApellido(conservarSiVacio(u.getApellido(), leerLinea("  Nuevo apellido: ")));

        String nuevoMail = leerLinea("  Nuevo mail    : ");
        if (!nuevoMail.isEmpty() && !nuevoMail.equals(u.getMail())) {
            Optional<Usuario> existente = usuarioRepo.buscarPorMail(nuevoMail);
            if (existente.isPresent() && !existente.get().getId().equals(u.getId())) {
                error("El mail ya esta en uso por otro usuario.");
                pausa();
                return;
            }
            u.setMail(nuevoMail);
        }

        String nuevoCelular = leerLinea("  Nuevo celular : ");
        if (!nuevoCelular.isEmpty()) {
            u.setCelular(nuevoCelular);
        }
        String nuevaContrasena = leerLinea("  Nueva contrasena: ");
        if (!nuevaContrasena.isEmpty()) {
            u.setContraseña(nuevaContrasena);
        }
        usuarioRepo.guardar(u);
        ok("Usuario actualizado correctamente.");
        System.out.println("       ID      : " + u.getId());
        System.out.println("       Nombre  : " + nombreCompletoUsuario(u));
        pausa();
    }

    private static void bajaUsuario() {
        subheader("BAJA LOGICA DE USUARIO");
        List<Usuario> activos = usuarioRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay usuarios activos para dar de baja.");
            pausa();
            return;
        }
        mostrarUsuariosTabla(activos);
        Long id = leerLong("  ID del usuario a dar de baja: ");

        Optional<Usuario> opt = usuarioRepo.buscarPorId(id);
        if (opt.isEmpty() || opt.get().isEliminado()) {
            error("El usuario no existe o ya esta dado de baja.");
            pausa();
            return;
        }
        Usuario u = opt.get();
        if (usuarioRepo.eliminarLogico(id)) {
            ok("Usuario '" + nombreCompletoUsuario(u) + "' dado de baja correctamente.");
        } else {
            error("No se pudo dar de baja el usuario.");
        }
        pausa();
    }

    private static void listarUsuarios() {
        subheader("LISTADO DE USUARIOS ACTIVOS");
        List<Usuario> activos = usuarioRepo.listarActivos();
        if (activos.isEmpty()) {
            info("No hay usuarios activos.");
        } else {
            mostrarUsuariosTabla(activos);
            System.out.println("  Total: " + activos.size() + " usuario(s) activo(s).");
        }
        pausa();
    }

    private static void buscarUsuarioPorMail() {
        subheader("BUSCAR USUARIO POR MAIL");
        String mail = leerLinea("  Mail a buscar: ");
        Optional<Usuario> opt = usuarioRepo.buscarPorMail(mail);
        if (opt.isEmpty()) {
            info("No existe usuario activo con ese mail.");
        } else {
            Usuario u = opt.get();
            ok("Usuario encontrado.");
            System.out.println("       ID      : " + u.getId());
            System.out.println("       Nombre  : " + nombreCompletoUsuario(u));
            System.out.println("       Mail    : " + u.getMail());
            System.out.println("       Celular : " + (u.getCelular() != null ? u.getCelular() : "-"));
            System.out.println("       Rol     : " + u.getRol());
        }
        pausa();
    }
    private static void menuPedidos() {
            boolean volver = false;
            while (!volver) {
                System.out.println();
                System.out.println("");
                header("GESTION DE PEDIDOS");
                System.out.println("  1. Alta de pedido");
                System.out.println("  2. Cambiar estado");
                System.out.println("  3. Baja logica de pedido");
                System.out.println("  4. Listado de pedidos");
                System.out.println("  5. Pedidos por usuario");
                System.out.println("  6. Pedidos por estado");
                System.out.println("  0. Volver al menu principal");
                System.out.println(LINE);
            
                String op = leerOpcion();
                switch (op) {
                    case "1" -> altaPedido();
                    case "2" -> cambiarEstadoPedido();
                    case "3" -> bajaPedido();
                    case "4" -> listarPedidos();
                    case "5" -> pedidosPorUsuario();
                    case "6" -> pedidosPorEstado();
                    case "0" -> volver = true;
                    default  -> opcionInvalida();
                }
            }
        }

    private static void altaPedido() {
            List<Usuario> usuarios = usuarioRepo.listarActivos();
            if (usuarios.isEmpty()) {
                System.out.println("Error: no hay usuarios activos. Cree un usuario primero.");
                return;
            }
            mostrarUsuariosTabla(usuarioRepo.listarActivos());
            Long usuarioId = leerLong("ID de usuario: ");
            Optional<Usuario> usuarioOpt = usuarioRepo.buscarPorId(usuarioId);
            if (usuarioOpt.isEmpty() || usuarioOpt.get().isEliminado()) {
                System.out.println("Error: usuario no válido.");
                return;
            }

            FormaPago formaPago = seleccionarFormaPago();
            List<ItemPedidoTemp> itemsTemp = new ArrayList<>();

            boolean agregarMas = true;
            while (agregarMas) {
                mostrarProductos();
                Long productoId = leerLong("ID de producto a agregar (0 para cancelar): ");
                if (productoId == 0) {
                    break;
                }
                Optional<Producto> prodOpt = productoRepo.buscarPorId(productoId);
                if (prodOpt.isEmpty() || prodOpt.get().isEliminado()) {
                    System.out.println("Error: producto no encontrado o dado de baja.");
                    continue;
                }
                Producto prod = prodOpt.get();
                if (!Boolean.TRUE.equals(prod.getDisponible())) {
                    System.out.println("Error: el producto no está disponible.");
                    continue;
                }
                int cantidad = leerInt("Cantidad (entero > 0): ");
                if (cantidad <= 0) {
                    System.out.println("Error: la cantidad debe ser mayor a 0.");
                    continue;
                }
                int stockReservado = itemsTemp.stream()
                        .filter(i -> i.productoId().equals(productoId))
                        .mapToInt(ItemPedidoTemp::cantidad)
                        .sum();
                if (prod.getStock() < stockReservado + cantidad) {
                    System.out.println("Error: stock insuficiente. Disponible: "
                            + (prod.getStock() - stockReservado));
                    continue;
                }
                itemsTemp.add(new ItemPedidoTemp(productoId, cantidad));
                agregarMas = leerSiNo("¿Agregar otro producto?", false);
            }

            if (itemsTemp.isEmpty()) {
                System.out.println("El pedido debe tener al menos un detalle. Operación cancelada.");
                return;
            }

            EntityManager em = emf.createEntityManager();
            EntityTransaction tx = em.getTransaction();
            try {
                tx.begin();

                Usuario usuario = em.find(Usuario.class, usuarioId);
                if (usuario == null || usuario.isEliminado()) {
                    throw new IllegalStateException("Usuario no válido.");
                }

                Pedido pedido = Pedido.builder()
                        .formaPago(formaPago)
                        .build();

                for (ItemPedidoTemp item : itemsTemp) {
                    Producto producto = em.find(Producto.class, item.productoId());
                    if (producto == null || producto.isEliminado()) {
                        throw new IllegalStateException("Producto ID " + item.productoId() + " no válido.");
                    }
                    if (!Boolean.TRUE.equals(producto.getDisponible())) {
                        throw new IllegalStateException("Producto " + producto.getNombre() + " no disponible.");
                    }
                    if (producto.getStock() < item.cantidad()) {
                        throw new IllegalStateException("Stock insuficiente para " + producto.getNombre()
                                + ". Disponible: " + producto.getStock());
                    }
                    pedido.addDetallePedido(item.cantidad(), producto);
                    producto.setStock(producto.getStock() - item.cantidad());
                }

                pedido.calcularTotal();
                usuario.addPedido(pedido);
                em.persist(pedido);

                tx.commit();

                System.out.println("\n--- Pedido creado exitosamente ---");
                System.out.println("ID: " + pedido.getId());
                System.out.println("Fecha: " + pedido.getFecha());
                System.out.println("Usuario: " + nombreCompletoUsuario(usuario));
                System.out.println("Forma de pago: " + pedido.getFormaPago());
                System.out.println("Detalle:");
                for (DetallePedido d : pedido.getDetalles()) {
                    System.out.printf("  - %s x%d = $%.2f%n",
                            d.getProducto().getNombre(), d.getCantidad(), d.getSubtotal());
                }
                System.out.printf("Total: $%.2f%n", pedido.getTotal());

            } catch (RuntimeException e) {
                if (tx.isActive()) {
                    tx.rollback();
                }
                System.out.println("Error al crear el pedido: " + e.getMessage());
                System.out.println("Se realizó rollback. No se modificó la base de datos.");
            } finally {
                em.close();
            }
        }

    private static void cambiarEstadoPedido() {
            Long id = leerLong("ID de pedido: ");
            Optional<Pedido> opt = pedidoRepo.buscarPorId(id);
            if (opt.isEmpty() || opt.get().isEliminado()) {
                System.out.println("Error: pedido no encontrado o dado de baja.");
                return;
            }
            Pedido p = opt.get();
            System.out.println("Estado actual: " + p.getEstado());
            EstadoPedido nuevoEstado = seleccionarEstadoPedido();
            p.setEstado(nuevoEstado);
            pedidoRepo.guardar(p);
            System.out.println("Pedido ID " + p.getId() + " actualizado a estado: " + p.getEstado());
        }

    private static void bajaPedido() {
            Long id = leerLong("ID de pedido a dar de baja: ");
            Optional<Pedido> opt = pedidoRepo.buscarPorId(id);
            if (opt.isEmpty() || opt.get().isEliminado()) {
                System.out.println("Error: pedido no encontrado o ya dado de baja.");
                return;
            }
            Pedido p = opt.get();
            if (pedidoRepo.eliminarLogico(id)) {
                System.out.printf("Pedido dado de baja -> ID: %d | Total: $%.2f%n", p.getId(), p.getTotal());
            } else {
                System.out.println("Error al dar de baja el pedido.");
            }
        }

    private static void listarPedidos() {
            List<Pedido> pedidos = pedidoRepo.listarActivos();
            if (pedidos.isEmpty()) {
                System.out.println("No hay pedidos activos.");
                return;
            }
            System.out.println("--- Pedidos activos ---");
            for (Pedido p : pedidos) {
                mostrarPedidoResumido(p);
            }
        }

    private static void pedidosPorUsuario() {
            mostrarUsuariosTabla(usuarioRepo.listarActivos());
            Long usuarioId = leerLong("ID de usuario: ");
            List<Pedido> pedidos = pedidoRepo.buscarPorUsuario(usuarioId);
            if (pedidos.isEmpty()) {
                System.out.println("El usuario no tiene pedidos activos.");
                return;
            }
            System.out.println("--- Pedidos del usuario ---");
            for (Pedido p : pedidos) {
                System.out.printf("ID: %d | Fecha: %s | Estado: %s | Total: $%.2f%n",
                        p.getId(), p.getFecha(), p.getEstado(), p.getTotal());
            }
        }

    private static void pedidosPorEstado() {
            EstadoPedido estado = seleccionarEstadoPedido();
            List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
            if (pedidos.isEmpty()) {
                System.out.println("No hay pedidos activos con estado " + estado + ".");
                return;
            }
            System.out.println("--- Pedidos con estado " + estado + " ---");
            for (Pedido p : pedidos) {
                String nombreUsuario = resolverUsuarioDePedido(p.getId())
                        .map(Main::nombreCompletoUsuario)
                        .orElse("Desconocido");
                System.out.printf("ID: %d | Fecha: %s | Usuario: %s | Total: $%.2f%n",
                        p.getId(), p.getFecha(), nombreUsuario, p.getTotal());
            }
        }
    private static void menuReportes() {
        boolean volver = false;
        while (!volver) {
            header("REPORTES");
            System.out.println("  1. Productos por categoria");
            System.out.println("  2. Pedidos por usuario");
            System.out.println("  3. Pedidos por estado");
            System.out.println("  4. Total facturado");
            System.out.println("  0. Volver al menu principal");
            System.out.println(LINE);
            String op = leerOpcion();
            switch (op) {
                case "1" -> reporteProductosPorCategoria();
                case "2" -> reportePedidosPorUsuario();
                case "3" -> reportePedidosPorEstado();
                case "4" -> reporteTotalFacturado();
                case "0" -> volver = true;
                default  -> opcionInvalida();
            }
        }
    }

    private static void reporteProductosPorCategoria() {
        subheader("PRODUCTOS POR CATEGORIA");
        List<Categoria> categorias = categoriaRepo.listarActivos();
        if (categorias.isEmpty()) {
            info("No hay categorias activas.");
            pausa();
            return;
        }
        System.out.println("  Categorias disponibles:");
        mostrarCategorias(categorias);

        Long catId = leerLong("  ID de la categoria a consultar: ");

        Optional<Categoria> optCat = categoriaRepo.buscarPorId(catId);
        if (optCat.isEmpty() || optCat.get().isEliminado()) {
            error("La categoria no existe o esta dada de baja.");
            pausa();
            return;
        }

        List<Producto> productos = productoRepo.buscarPorCategoria(catId);
        System.out.println();
        System.out.println("  Resultado para la categoria: " + optCat.get().getNombre());
        System.out.println("  " + SUB);
        if (productos.isEmpty()) {
            info("La categoria '" + optCat.get().getNombre() + "' no tiene productos activos.");
        } else {
            System.out.printf("  %-5s | %-25s | %-12s | %-6s | %-8s%n", "ID", "NOMBRE", "PRECIO", "STOCK", "DISP.");
            System.out.println("  " + SUB);
            for (Producto p : productos) {
                double precio = p.getPrecio() != null ? p.getPrecio() : 0.0;
                String disp = Boolean.TRUE.equals(p.getDisponible()) ? "Si" : "No";
                System.out.printf("  %-5d | %-25s | $%-11.2f | %-6d | %-8s%n",
                        p.getId(), safe(p.getNombre(), 25), precio, p.getStock(), disp);
            }
            System.out.println();
            ok("Total de productos encontrados: " + productos.size());
        }
        pausa();
    }

    private static void reportePedidosPorUsuario() {
        subheader("PEDIDOS POR USUARIO");
        List<Usuario> usuarios = usuarioRepo.listarActivos();
        if (usuarios.isEmpty()) {
            info("No hay usuarios activos.");
            pausa();
            return;
        }
        mostrarUsuariosTabla(usuarios);
        Long usuarioId = leerLong("  ID de usuario: ");
        List<Pedido> pedidos = pedidoRepo.buscarPorUsuario(usuarioId);
        if (pedidos.isEmpty()) {
            info("El usuario no tiene pedidos activos.");
        } else {
            System.out.println();
            System.out.printf("  %-5s | %-12s | %-12s | %-12s | %-12s%n",
                    "ID", "FECHA", "ESTADO", "PAGO", "TOTAL");
            System.out.println("  " + SUB);
            for (Pedido p : pedidos) {
                System.out.printf("  %-5d | %-12s | %-12s | %-12s | $%-11.2f%n",
                        p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), p.getTotal());
            }
            System.out.println();
            ok("Total de pedidos: " + pedidos.size());
        }
        pausa();
    }

    private static void reportePedidosPorEstado() {
        subheader("PEDIDOS POR ESTADO");
        EstadoPedido estado = seleccionarEstadoPedido();
        List<Pedido> pedidos = pedidoRepo.buscarPorEstado(estado);
        if (pedidos.isEmpty()) {
            info("No hay pedidos activos con estado " + estado + ".");
        } else {
            System.out.println();
            System.out.printf("  %-5s | %-12s | %-25s | %-12s%n", "ID", "FECHA", "USUARIO", "TOTAL");
            System.out.println("  " + SUB);
            for (Pedido p : pedidos) {
                String nombreUsuario = resolverUsuarioDePedido(p.getId())
                        .map(Main::nombreCompletoUsuario)
                        .orElse("Desconocido");
                System.out.printf("  %-5d | %-12s | %-25s | $%-11.2f%n",
                        p.getId(), p.getFecha(), safe(nombreUsuario, 25), p.getTotal());
            }
            System.out.println();
            ok("Total de pedidos: " + pedidos.size());
        }
        pausa();
    }

    private static void reporteTotalFacturado() {
        subheader("TOTAL FACTURADO");
        List<Pedido> terminados = pedidoRepo.buscarPorEstado(EstadoPedido.TERMINADO);
        double total = terminados.stream()
                .mapToDouble(p -> p.getTotal() != null ? p.getTotal() : 0.0)
                .sum();
        ok("Total facturado (pedidos TERMINADO): " + String.format(Locale.US, "$%.2f", total));
        pausa();
    }

    private static String leerLinea(String prompt) {
        System.out.print(prompt);
        return sc.nextLine().trim();
    }

    private static String conservarSiVacio(String actual, String ingresado) {
        return ingresado.isEmpty() ? actual : ingresado;
    }

    private static boolean leerSiNo(String prompt, boolean defaultSi) {
        while (true) {
            String input = leerLinea(prompt + (defaultSi ? " [S/n]: " : " [s/N]: "));
            if (input.isEmpty()) {
                return defaultSi;
            }
            if (input.equalsIgnoreCase("S") || input.equalsIgnoreCase("SI")) {
                return true;
            }
            if (input.equalsIgnoreCase("N") || input.equalsIgnoreCase("NO")) {
                return false;
            }
            error("Respuesta invalida. Use S o N.");
        }
    }

    private static String resolverCategoriaDeProducto(Long productoId) {
        for (Categoria c : categoriaRepo.listarActivos()) {
            Optional<Categoria> catOpt = categoriaRepo.buscarPorId(c.getId());
            if (catOpt.isPresent()) {
                for (Producto p : catOpt.get().getProductos()) {
                    if (p.getId().equals(productoId) && !p.isEliminado()) {
                        return c.getNombre();
                    }
                }
            }
        }
        return "Sin categoria";
    }

    private static Optional<Usuario> resolverUsuarioDePedido(Long pedidoId) {
        for (Usuario u : usuarioRepo.listarActivos()) {
            Optional<Usuario> uOpt = usuarioRepo.buscarPorId(u.getId());
            if (uOpt.isPresent()) {
                for (Pedido p : uOpt.get().getPedidos()) {
                    if (p.getId().equals(pedidoId) && !p.isEliminado()) {
                        return Optional.of(uOpt.get());
                    }
                }
            }
        }
        return Optional.empty();
    }

    private static String nombreCompletoUsuario(Usuario u) {
        return u.getNombre() + " " + u.getApellido();
    }

    private static FormaPago seleccionarFormaPago() {
        System.out.println("  Formas de pago:");
        FormaPago[] valores = FormaPago.values();
        for (int i = 0; i < valores.length; i++) {
            System.out.println("  " + (i + 1) + ". " + valores[i]);
        }
        while (true) {
            int op = leerInt("  Seleccione forma de pago: ");
            if (op >= 1 && op <= valores.length) {
                return valores[op - 1];
            }
            error("Opcion invalida.");
        }
    }

    private static EstadoPedido seleccionarEstadoPedido() {
        System.out.println("  Estados disponibles:");
        EstadoPedido[] valores = EstadoPedido.values();
        for (int i = 0; i < valores.length; i++) {
            System.out.println("  " + (i + 1) + ". " + valores[i]);
        }
        while (true) {
            int op = leerInt("  Seleccione estado: ");
            if (op >= 1 && op <= valores.length) {
                return valores[op - 1];
            }
            error("Opcion invalida.");
        }
    }

    private static Rol seleccionarRol() {
        System.out.println("  Roles disponibles:");
        System.out.println("  1. ADMIN");
        System.out.println("  2. USUARIO");
        while (true) {
            int op = leerInt("  Seleccione rol: ");
            if (op == 1) return Rol.ADMIN;
            if (op == 2) return Rol.USUARIO;
            error("Opcion invalida.");
        }
    }

    private static void mostrarCategorias() {
        mostrarCategorias(categoriaRepo.listarActivos());
    }

    private static void mostrarProductos() {
        mostrarProductos(productoRepo.listarActivos());
    }

    private static void mostrarUsuarios() {
        mostrarUsuariosTabla(usuarioRepo.listarActivos());
    }

    private static void mostrarUsuariosTabla(List<Usuario> usuarios) {
        if (usuarios.isEmpty()) {
            info("No hay usuarios activos.");
            return;
        }
        System.out.println();
        System.out.printf("  %-5s | %-25s | %-30s | %-10s | %-12s%n",
                "ID", "NOMBRE", "MAIL", "ROL", "CELULAR");
        System.out.println("  " + SUB);
        for (Usuario u : usuarios) {
            System.out.printf("  %-5d | %-25s | %-30s | %-10s | %-12s%n",
                    u.getId(),
                    safe(nombreCompletoUsuario(u), 25),
                    safe(u.getMail(), 30),
                    u.getRol(),
                    safe(u.getCelular() != null ? u.getCelular() : "-", 12));
        }
        System.out.println();
    }

    private static void mostrarPedidoResumido(Pedido p) {
        String nombreUsuario = resolverUsuarioDePedido(p.getId())
                .map(Main::nombreCompletoUsuario)
                .orElse("Desconocido");
        System.out.printf("  ID: %d | Fecha: %s | Estado: %s | Pago: %s | Usuario: %s | Total: $%.2f%n",
                p.getId(), p.getFecha(), p.getEstado(), p.getFormaPago(), nombreUsuario, p.getTotal());
    }

    // ============================================================
    // HELPERS DE PRESENTACION
    // ============================================================
    private static void header(String titulo) {
        System.out.println();
        System.out.println(LINE);
        System.out.println("                  " + titulo);
        System.out.println(LINE);
    }

    private static void subheader(String titulo) {
        System.out.println();
        System.out.println("  >> " + titulo);
        System.out.println("  " + SUB);
    }

    private static void ok(String msg) {
        System.out.println();
        System.out.println("  [OK] " + msg);
    }

    private static void error(String msg) {
        System.out.println();
        System.out.println("  [ERROR] " + msg);
    }

    private static void info(String msg) {
        System.out.println();
        System.out.println("  [INFO] " + msg);
    }

    private static void opcionInvalida() {
        error("Opcion invalida. Intente nuevamente.");
        pausa();
    }

    private static void pausa() {
        System.out.println();
        System.out.print("  Presione ENTER para continuar...");
        sc.nextLine();
    }

    private static String safe(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max - 1) + "." : s;
    }

    // ============================================================
    // HELPERS DE LECTURA
    // ============================================================
    private static String leerOpcion() {
        System.out.print("  Opcion: ");
        return sc.nextLine().trim();
    }

    private static Long leerLong(String prompt) {
        while (true) {
            String s = leerLinea(prompt);
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException e) {
                error("Debe ingresar un numero entero valido.");
            }
        }
    }

    private static Integer leerInt(String prompt) {
        while (true) {
            String s = leerLinea(prompt);
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException e) {
                error("Debe ingresar un numero entero valido.");
            }
        }
    }

    private static Double leerDouble(String prompt) {
        while (true) {
            String s = leerLinea(prompt);
            try {
                return Double.parseDouble(s);
            } catch (NumberFormatException e) {
                error("Debe ingresar un numero valido.");
            }
        }
    }
}
