const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/arqueos - lista todos
router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM arqueos_inventario ORDER BY id DESC LIMIT 100");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/arqueos - crear arqueo físico
router.post("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const { sucursal, items, total_items, con_diferencia, cuadra, observacion_general, hora_inicio, hora_fin } = req.body;
    if (!sucursal) return res.status(400).json({ error: "Faltan datos: sucursal obligatoria" });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO arqueos_inventario (sucursal, usuario, items, total_items, con_diferencia, cuadra, observacion_general, hora_inicio, hora_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      sucursal, req.user.name, JSON.stringify(items || []),
      parseInt(total_items)||0, parseInt(con_diferencia)||0, cuadra !== false,
      observacion_general || null, hora_inicio || null, hora_fin || null
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
