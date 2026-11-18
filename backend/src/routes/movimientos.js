const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/movimientos - historial completo
router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM movimientos ORDER BY id DESC LIMIT $1`, limit);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/movimientos - crear movimiento manual
router.post("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const { tipo, descripcion, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, producto_id, producto_nombre, sucursal, referencia } = req.body;
    if (!tipo) return res.status(400).json({ error: "Falta tipo" });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO movimientos (tipo, descripcion, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, producto_id, producto_nombre, sucursal, referencia, usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      tipo, descripcion||null, parseInt(cantidad)||0, parseInt(cantidad_maples)||0, parseInt(cantidad_medias)||0, parseInt(cantidad_docenas)||0, parseInt(cantidad_unidades)||0,
      producto_id?parseInt(producto_id):null, producto_nombre||null, sucursal||null, referencia||null, req.user.name
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
