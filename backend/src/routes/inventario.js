const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/inventario
router.get("/", async (req, res) => {
  try {
    const lotes = await prisma.inventario.findMany({ include: { producto: true, sucursal: true }, orderBy: { fechaLlegada: "asc" } });
    res.json(lotes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/inventario
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    let sucursalId = body.sucursalId;
    if (!sucursalId && body.sucursal) {
      const suc = await prisma.sucursal.findFirst({ where: { nombre: body.sucursal } });
      if (suc) sucursalId = suc.id;
      else {
        const nueva = await prisma.sucursal.create({ data: { nombre: body.sucursal } });
        sucursalId = nueva.id;
      }
    }
    if (!sucursalId) sucursalId = 1;
    
    const lote = await prisma.inventario.create({
      data: {
        productoId: parseInt(body.productoId) || 1,
        sucursalId: sucursalId,
        banco: body.banco || null,
        fechaLlegada: body.fechaLlegada ? new Date(body.fechaLlegada) : new Date(),
        cantidad: parseInt(body.cantidad) || 0,
        precioCompra: parseFloat(body.precioCompra) || 0,
        cantidadVendida: parseInt(body.cantidadVendida) || 0,
        esTraspaso: body.esTraspaso || false
      },
      include: { producto: true, sucursal: true }
    });
    res.status(201).json(lote);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/inventario/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cantidad, precioCompra, sucursal, banco } = req.body;
    let sucursalId;
    if (sucursal) {
      const suc = await prisma.sucursal.findFirst({ where: { nombre: sucursal } });
      if (suc) sucursalId = suc.id;
    }
    const data = {};
    if (cantidad !== undefined) data.cantidad = parseInt(cantidad);
    if (precioCompra !== undefined) data.precioCompra = parseFloat(precioCompra);
    if (sucursalId) data.sucursalId = sucursalId;
    if (banco !== undefined) data.banco = banco;
    
    const lote = await prisma.inventario.update({ where: { id }, data, include: { producto: true, sucursal: true } });
    res.json(lote);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/inventario/:id - borrar lote del inventario
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.inventario.delete({ where: { id } });
    res.json({ ok: true, message: "Lote eliminado correctamente" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/inventario/movimientos
router.get("/movimientos", async (req, res) => {
  try {
    const movs = await prisma.movimiento.findMany({ orderBy: { fecha: "desc" }, take: 500 });
    res.json(movs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
