const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/ajustes - lista todos
router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM ajustes_inventario ORDER BY id DESC LIMIT 500");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/ajustes - crear ajuste manual
router.post("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const { inventario_id, producto_id, producto_nombre, sucursal, tipo, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, stock_antes, stock_despues, motivo, comentario } = req.body;
    if (!producto_id || !sucursal || !tipo || !cantidad || !motivo) {
      return res.status(400).json({ error: "Faltan datos obligatorios: producto_id, sucursal, tipo, cantidad, motivo" });
    }
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO ajustes_inventario (inventario_id, producto_id, producto_nombre, sucursal, tipo, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, stock_antes, stock_despues, motivo, comentario, usuario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      inventario_id ? parseInt(inventario_id) : null, parseInt(producto_id), producto_nombre || null, sucursal, tipo, parseInt(cantidad),
      parseInt(cantidad_maples)||0, parseInt(cantidad_medias)||0, parseInt(cantidad_docenas)||0, parseInt(cantidad_unidades)||0,
      stock_antes ? parseInt(stock_antes) : null, stock_despues ? parseInt(stock_despues) : null, motivo, comentario || null, req.user.name
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
