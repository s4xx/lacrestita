const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const pedidos = await prisma.$queryRawUnsafe("SELECT * FROM pedidos ORDER BY id DESC LIMIT 200");
    res.json(pedidos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const ahora = new Date();
    const r = await prisma.$queryRawUnsafe(
      'INSERT INTO pedidos (numero, "ventaId", cliente, tel, dir, productos, total, metodo, estado, "fechaCreacion", "fechaEntrega", "distribuidorId", observacion, origen, "modoEntrega", "horaPreferida", "sucursalRecoger", "recargoDelivery", subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *',
      parseInt(b.numero) || 1, b.ventaId || null, b.cliente || 'Cliente', b.tel || null, b.dir || b.direccion || null,
      b.productos || '', parseFloat(b.total) || 0, b.metodo || 'EFECTIVO', b.estado || 'PENDIENTE',
      ahora.toISOString(), b.fechaEntrega || ahora.toISOString().split('T')[0],
      b.distribuidorId || null, b.observacion || null, b.origen || 'MANUAL',
      b.modoEntrega || null, b.horaPreferida || null, b.sucursalRecoger || null,
      parseFloat(b.recargoDelivery) || 0, parseFloat(b.subtotal) || 0
    );
    res.status(201).json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/pedidos/:id - actualizar estado, asignar distribuidor
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado, distribuidorId, distribuidorNombre, observacion, fechaEntrega } = req.body;
    const sets = [];
    const vals = [];
    let idx = 1;
    if (estado) { sets.push('"estado" = $' + idx); vals.push(estado); idx++; }
    if (distribuidorId !== undefined) { sets.push('"distribuidorId" = $' + idx); vals.push(distribuidorId || null); idx++; }
    if (observacion) { sets.push('"observacion" = $' + idx); vals.push(observacion); idx++; }
    if (fechaEntrega) { sets.push('"fechaEntrega" = $' + idx); vals.push(fechaEntrega); idx++; }
    if (sets.length === 0) return res.json({ ok: true, message: 'Nada que actualizar' });
    vals.push(id);
    const r = await prisma.$queryRawUnsafe('UPDATE pedidos SET ' + sets.join(', ') + ' WHERE id = $' + idx + ' RETURNING *', ...vals);
    res.json(r[0] || { ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
