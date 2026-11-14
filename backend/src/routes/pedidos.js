const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const p = await prisma.pedido.findMany({ orderBy: { numero: "desc" }, take: 100 });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const count = await prisma.pedido.count();
    const p = await prisma.pedido.create({ data: { ...req.body, numero: count + 1 } });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

