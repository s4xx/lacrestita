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
    const lote = await prisma.inventario.create({ data: req.body });
    res.status(201).json(lote);
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

