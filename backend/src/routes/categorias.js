const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA", "DISTRIBUIDOR"]), async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM categorias ORDER BY id");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const { nombre, icon, color } = req.body;
    if (!nombre) return res.status(400).json({ error: "Falta nombre" });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO categorias (nombre, icon, color) VALUES ($1,$2,$3) RETURNING *`,
      nombre, icon||'📦', color||'#3B82F6'
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, icon, color } = req.body;
    const r = await prisma.$queryRawUnsafe(
      `UPDATE categorias SET nombre=COALESCE($1,nombre), icon=COALESCE($2,icon), color=COALESCE($3,color) WHERE id=$4 RETURNING *`,
      nombre||null, icon||null, color||null, id
    );
    if (!r.length) return res.status(404).json({ error: "No encontrada" });
    res.json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.$queryRawUnsafe(`DELETE FROM categorias WHERE id=$1`, id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
