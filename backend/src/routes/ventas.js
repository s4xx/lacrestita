const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

// GET /api/ventas
router.get("/", async (req, res) => {
  try {
    const ventas = await prisma.ventaTienda.findMany({ include: { items: true }, orderBy: { fecha: "desc" }, take: 100 });
    res.json(ventas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ventas
router.post("/", async (req, res) => {
  try {
    const { items, ...ventaData } = req.body;
    const venta = await prisma.ventaTienda.create({
      data: {
        ...ventaData,
        items: { create: items || [] }
      },
      include: { items: true }
    });
    res.status(201).json(venta);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

