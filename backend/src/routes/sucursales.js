const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/sucursales
router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA", "DISTRIBUIDOR"]), async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM sucursales ORDER BY id");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/sucursales (solo admin)
router.post("/", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const { nombre, direccion, telefono, responsable } = req.body;
    if (!nombre) return res.status(400).json({ error: "Falta nombre" });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO sucursales (nombre, direccion, telefono, responsable) VALUES ($1,$2,$3,$4) RETURNING *`,
      nombre, direccion||null, telefono||null, responsable||null
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/sucursales/:id
router.put("/:id", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, direccion, telefono, responsable, activa } = req.body;
    const r = await prisma.$queryRawUnsafe(
      `UPDATE sucursales SET nombre=COALESCE($1,nombre), direccion=COALESCE($2,direccion), telefono=COALESCE($3,telefono), responsable=COALESCE($4,responsable), activa=COALESCE($5,activa) WHERE id=$6 RETURNING *`,
      nombre||null, direccion||null, telefono||null, responsable||null, activa===undefined?null:activa, id
    );
    if (!r.length) return res.status(404).json({ error: "No encontrada" });
    res.json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/sucursales/:id (soft delete: marcar inactiva)
router.delete("/:id", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const r = await prisma.$queryRawUnsafe(`UPDATE sucursales SET activa=FALSE WHERE id=$1 RETURNING *`, id);
    if (!r.length) return res.status(404).json({ error: "No encontrada" });
    res.json({ ok: true, sucursal: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
