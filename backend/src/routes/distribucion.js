const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const asig = await prisma.asignacionDistribuidor.findMany({ include: { entregas: true }, orderBy: { fecha: "desc" }, take: 50 });
    res.json(asig);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const a = await prisma.asignacionDistribuidor.create({ data: req.body });
    res.status(201).json(a);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/entregas", async (req, res) => {
  try {
    const e = await prisma.entregaDistribuidor.create({ data: { ...req.body, asignacionId: parseInt(req.params.id) } });
    res.status(201).json(e);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

