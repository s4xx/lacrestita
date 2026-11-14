const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/productos
router.get("/", async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({ where: { activo: true }, include: { categoria: true }, orderBy: { nombre: "asc" } });
    res.json(productos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/productos
router.post("/", async (req, res) => {
  try {
    const p = await prisma.producto.create({ data: req.body });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/productos/:id
router.put("/:id", async (req, res) => {
  try {
    const p = await prisma.producto.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/productos/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.producto.update({ where: { id: parseInt(req.params.id) }, data: { activo: false } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

