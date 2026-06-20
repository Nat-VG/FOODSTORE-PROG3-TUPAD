package com.tp.jpa.util;

import com.tp.jpa.model.*;
import com.tp.jpa.model.enums.EstadoPedido;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

public final class DataSeeder {

    private DataSeeder() {}

    public static void seedIfEmpty() {
        CategoriaRepository categoriaRepo = new CategoriaRepository();
        if (!categoriaRepo.listarActivos().isEmpty()) {
            return;
        }
        System.out.println();
        System.out.println("  [INFO] Base de datos vacia. Cargando datos iniciales...");
        System.out.println();
        seedCategoriasYProductos(categoriaRepo);
        seedUsuarios();
        seedPedidosDemo();
        System.out.println("  [OK] Datos iniciales cargados correctamente.");
        System.out.println();
    }

    private static void seedCategoriasYProductos(CategoriaRepository categoriaRepo) {
        record CatDef(String nombre, String desc) {}
        record ProdDef(String nombre, double precio, String desc, int stock, String imagen, boolean disponible) {}

        Map<String, CatDef> cats = new LinkedHashMap<>();
        cats.put("Hamburguesas", new CatDef("Hamburguesas", "Hamburguesas artesanales con carne premium"));
        cats.put("Pizzas", new CatDef("Pizzas", "Pizzas al horno de barro"));
        cats.put("Empanadas", new CatDef("Empanadas", "Empanadas caseras horneadas"));
        cats.put("Bebidas", new CatDef("Bebidas", "Bebidas frias y calientes"));
        cats.put("Papas Fritas", new CatDef("Papas Fritas", "Acompanamientos crujientes"));

        Map<String, ProdDef[]> prods = new java.util.HashMap<>();
        prods.put("Hamburguesas", new ProdDef[]{
            new ProdDef("Hamburguesa Clasica", 12500, "Carne 150g, lechuga, tomate y mayonesa", 50, imgProducto(1), true),
            new ProdDef("Hamburguesa Doble", 16800, "Doble carne, cheddar, panceta y barbacoa", 40, imgProducto(2), true),
            new ProdDef("Hamburguesa Completa", 14200, "Carne, huevo, jamon, queso, lechuga y tomate", 30, imgProducto(3), true),
            new ProdDef("Hamburguesa Veggie", 13500, "Medallon de lentejas, rucula y hummus", 20, imgProducto(4), true),
        });
        prods.put("Pizzas", new ProdDef[]{
            new ProdDef("Pizza Mozzarella", 9800, "Mozzarella, salsa de tomate y oregano", 25, imgProducto(5), true),
            new ProdDef("Pizza Napolitana", 11200, "Mozzarella, tomate, ajo y albahaca", 25, imgProducto(6), true),
            new ProdDef("Pizza Fugazzeta", 11800, "Mozzarella, cebolla, jamon y aceitunas", 20, imgProducto(7), true),
            new ProdDef("Pizza Especial", 13500, "Pepperoni, morron, cebolla, huevo y aceitunas", 15, imgProducto(8), true),
        });
        prods.put("Empanadas", new ProdDef[]{
            new ProdDef("Empanada de Carne", 2800, "Carne picada, cebolla, huevo y aceitunas", 100, imgProducto(9), true),
            new ProdDef("Empanada de Pollo", 2800, "Pollo, cebolla, morron y crema", 80, imgProducto(10), true),
            new ProdDef("Empanada Jamon y Queso", 2600, "Jamon cocido y mozzarella", 90, imgProducto(11), false),
            new ProdDef("Empanada de Verdura", 2600, "Espinaca, acelga y ricota", 60, imgProducto(12), true),
        });
        prods.put("Bebidas", new ProdDef[]{
            new ProdDef("Coca-Cola 500ml", 3200, "Gaseosa Coca-Cola 500ml", 200, imgProducto(13), true),
            new ProdDef("Sprite 500ml", 3200, "Gaseosa Sprite 500ml", 180, imgProducto(14), true),
            new ProdDef("Agua Mineral 500ml", 2200, "Agua mineral sin gas 500ml", 300, imgProducto(15), true),
            new ProdDef("Cerveza Artesanal 473ml", 5200, "Cerveza rubia 473ml", 100, imgProducto(16), true),
        });
        prods.put("Papas Fritas", new ProdDef[]{
            new ProdDef("Papas Fritas Clasicas", 7200, "Papas baston crocantes", 70, imgProducto(17), true),
            new ProdDef("Papas con Cheddar y Panceta", 9500, "Papas con cheddar y panceta", 50, imgProducto(18), true),
            new ProdDef("Aros de Cebolla", 7800, "Aros empanizados con barbacoa", 40, imgProducto(19), true),
            new ProdDef("Papas Bravas", 8400, "Papas con salsa brava y alioli", 35, imgProducto(20), true),
        });

        for (Map.Entry<String, CatDef> entry : cats.entrySet()) {
            Categoria categoria = Categoria.builder().nombre(entry.getValue().nombre()).descripcion(entry.getValue().desc()).build();
            ProdDef[] lista = prods.get(entry.getKey());
            if (lista != null) {
                for (ProdDef pd : lista) {
                    categoria.addProducto(Producto.builder().nombre(pd.nombre()).precio(pd.precio()).descripcion(pd.desc()).stock(pd.stock()).imagen(pd.imagen()).disponible(pd.disponible()).build());
                }
            }
            categoriaRepo.guardar(categoria);
        }
    }

    private static void seedUsuarios() {
        UsuarioRepository repo = new UsuarioRepository();
        repo.guardar(Usuario.builder().nombre("Admin").apellido("Sistema").mail("admin@admin.com").celular("1145678901").contraseña("123456").rol(Rol.ADMIN).build());
        repo.guardar(Usuario.builder().nombre("Natalia").apellido("Gutierrez").mail("cliente@food.com").celular("1198765432").contraseña("cliente123").rol(Rol.USUARIO).build());
    }

    private static void seedPedidosDemo() {
        EntityManagerFactory emf = JPAUtil.getEntityManagerFactory();
        EntityManager em = emf.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        try {
            tx.begin();
            Usuario cliente = em.createQuery("SELECT u FROM Usuario u WHERE u.mail = :mail AND u.eliminado = false", Usuario.class)
                    .setParameter("mail", "cliente@food.com").getResultList().stream().findFirst().orElse(null);
            if (cliente == null) { tx.rollback(); return; }
            crearPedido(em, cliente, FormaPago.TARJETA, EstadoPedido.TERMINADO, new int[]{1, 15}, new int[]{2, 2});
            crearPedido(em, cliente, FormaPago.EFECTIVO, EstadoPedido.CONFIRMADO, new int[]{2, 8, 17}, new int[]{1, 1, 2});
            tx.commit();
        } catch (RuntimeException e) {
            if (tx.isActive()) tx.rollback();
        } finally {
            em.close();
        }
    }

    private static void crearPedido(EntityManager em, Usuario usuario, FormaPago pago, EstadoPedido estado, int[] productoIds, int[] cantidades) {
        Pedido pedido = Pedido.builder().fecha(LocalDate.now()).estado(estado).formaPago(pago).build();
        for (int i = 0; i < productoIds.length; i++) {
            Producto producto = em.find(Producto.class, (long) productoIds[i]);
            if (producto != null && !producto.isEliminado()) {
                pedido.addDetallePedido(cantidades[i], producto);
                producto.setStock(Math.max(0, producto.getStock() - cantidades[i]));
            }
        }
        pedido.calcularTotal();
        usuario.addPedido(pedido);
        em.persist(pedido);
    }

    private static String imgProducto(int id) {
        return "/images/products/" + id + ".jpg";
    }
}
