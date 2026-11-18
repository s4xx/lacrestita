const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tienda/productos - PUBLICO
router.get("/productos", async (req, res) => {
  try {
    const productos = await prisma.$queryRawUnsafe(
      `SELECT id, nombre, icon, "precioMaple", "precioUnidad", "precioRecoger", "precioDomicilio", "diasVencimiento", "unidadesPorMaple", "stockBajo"
       FROM productos WHERE activo = true ORDER BY id`
    );
    res.json(productos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tienda/pedidos - PUBLICO (sin auth)
router.post("/pedidos", async (req, res) => {
  try {
    const body = req.body;
    const ahora = new Date();
    if (!body.cliente || !body.tel) return res.status(400).json({ error: "Faltan datos: cliente y teléfono obligatorios" });
    if (!body.modo || (body.modo !== "DOMICILIO" && body.modo !== "RECOJO")) return res.status(400).json({ error: "Modo debe ser DOMICILIO o RECOJO" });
    if (body.modo === "DOMICILIO" && !body.direccion) return res.status(400).json({ error: "Dirección obligatoria para entrega a domicilio" });
    if (!body.items || !body.items.length) return res.status(400).json({ error: "Carrito vacío" });
    
    // Contar pedidos web existentes para número correlativo W-
    const countWeb = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as n FROM pedidos WHERE origen = 'WEB'`);
    const numeroWeb = 'W-' + String((countWeb[0].n || 0) + 1).padStart(4, '0');
    
    // Contar todos los pedidos para numero interno
    const countAll = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as n FROM pedidos`);
    const numero = (countAll[0].n || 0) + 1;
    
    // Insertar pedido - usar nombres de columnas existentes: dir (no direccion), etc.
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO pedidos (
        numero, "ventaId", cliente, tel, dir, productos, total, metodo, estado,
        "fechaCreacion", "fechaEntrega", observacion,
        origen, "modoEntrega", "horaPreferida", "sucursalRecoger",
        "recargoDelivery", subtotal
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id, numero, "ventaId"`,
      numero, numeroWeb,
      body.cliente,
      body.tel,
      body.direccion || null,
      body.productos || null,
      parseFloat(body.total) || 0,
      body.metodo || 'EFECTIVO',
      'PENDIENTE',
      ahora.toISOString(),
      ahora.toISOString().split('T')[0],
      body.observacion || null,
      'WEB',
      body.modo,
      body.horaPreferida || null,
      body.sucursalRecoger || null,
      parseFloat(body.recargoDelivery) || 0,
      parseFloat(body.subtotal) || 0
    );
    res.status(201).json({
      ok: true,
      numeroWeb: numeroWeb,
      pedidoId: r[0].id,
      message: 'Pedido recibido correctamente'
    });
  } catch (e) {
    console.error('Error pedidos web:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
