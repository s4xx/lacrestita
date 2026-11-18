const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const ventas = await prisma.ventaTienda.findMany({ include: { items: true }, orderBy: { fecha: "desc" }, take: 200 });
    res.json(ventas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { items, ...ventaData } = req.body;
    const ahora = new Date();
    if (!ventaData.fecha) ventaData.fecha = ahora;
    if (!ventaData.hora) ventaData.hora = ahora.toTimeString().split(' ')[0];
    if (!ventaData.productoId) ventaData.productoId = 1;
    if (!ventaData.cantidad) ventaData.cantidad = 1;
    if (!ventaData.total) ventaData.total = 0;
    if (!ventaData.metodoPago) ventaData.metodoPago = 'EFECTIVO';
    if (!ventaData.cliente) ventaData.cliente = 'Consumidor Final';
    if (!ventaData.vendedor) ventaData.vendedor = 'Tienda';
    if (!ventaData.sucursal) ventaData.sucursal = 'Central';
    if (!ventaData.estado) ventaData.estado = 'ACTIVA';
    if (!ventaData.productos) {
      const p = await prisma.producto.findUnique({ where: { id: parseInt(ventaData.productoId) } });
      ventaData.productos = (p ? p.nombre : 'Producto') + ' (' + ventaData.cantidad + 'u)';
    }
    // Mapear metodoPago → metodo (schema usa metodo)
    if (ventaData.metodoPago && !ventaData.metodo) ventaData.metodo = ventaData.metodoPago;
    const venta = await prisma.ventaTienda.create({
      data: { ...ventaData, items: { create: items || [] } },
      include: { items: true }
    });
    res.status(201).json(venta);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/ventas/:id - anular o actualizar venta
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado, anulada, motivoAnulacion } = req.body;
    const data = {};
    if (estado) data.estado = estado;
    if (anulada !== undefined) data.anulada = !!anulada;
    if (motivoAnulacion) data.motivoAnulacion = motivoAnulacion;
    const venta = await prisma.ventaTienda.update({ where: { id }, data, include: { items: true } });
    res.json(venta);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
