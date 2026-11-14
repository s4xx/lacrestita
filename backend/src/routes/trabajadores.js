const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const t = await prisma.trabajador.findMany({ include: { sucursal: true }, orderBy: { nombre: "asc" } });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const t = await prisma.trabajador.create({ data: req.body });
    res.status(201).json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

