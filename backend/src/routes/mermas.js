const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const mermas = await prisma.merma.findMany({ orderBy: { fecha: "desc" }, take: 200 });
    res.json(mermas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const ahora = new Date();
    let prodNombre = body.productoNombre;
    if (!prodNombre && body.productoId) {
      const p = await prisma.producto.findUnique({ where: { id: parseInt(body.productoId) } });
      prodNombre = p ? p.nombre : 'Producto';
    }
    const merma = await prisma.merma.create({
      data: {
        fecha: body.fecha ? new Date(body.fecha) : ahora,
        hora: body.hora || ahora.toTimeString().split(' ')[0],
        tipo: body.tipo || body.motivo || 'ROTOS',
        cantidad: parseInt(body.cantidad) || 0,
        productoId: parseInt(body.productoId) || 1,
        productoNombre: prodNombre || 'Producto',
        sucursal: body.sucursal || 'Central',
        cliente: body.cliente || null,
        descripcion: body.descripcion || body.observacion || (prodNombre + ' - ' + (body.motivo || body.tipo || 'ROTOS')),
        fotoBase64: body.fotoBase64 || null,
        registradoPor: body.registradoPor || body.usuario || null
      }
    });
    res.status(201).json(merma);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.merma.delete({ where: { id } });
    res.json({ ok: true, message: 'Merma eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
