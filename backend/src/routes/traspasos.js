const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const router = express.Router();
const prisma = new PrismaClient();

router.get("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM traspasos ORDER BY id DESC LIMIT 500");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", ...requireAuthRole(["ADMIN", "GERENTE", "ENCARGADO_TIENDA"]), async (req, res) => {
  try {
    const { origen, destino, producto_id, producto_nombre, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, motivo } = req.body;
    if (origen === destino) return res.status(400).json({ error: 'Origen y destino iguales' });
    const r = await prisma.$queryRawUnsafe(
      'INSERT INTO traspasos (origen, destino, producto_id, producto_nombre, cantidad, cantidad_maples, cantidad_medias, cantidad_docenas, cantidad_unidades, motivo, usuario) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      origen, destino, parseInt(producto_id)||1, producto_nombre||null, parseInt(cantidad)||0,
      parseInt(cantidad_maples)||0, parseInt(cantidad_medias)||0, parseInt(cantidad_docenas)||0, parseInt(cantidad_unidades)||0,
      motivo||null, req.user.name
    );
    res.status(201).json(r[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.$queryRawUnsafe('DELETE FROM traspasos WHERE id = $1', id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
