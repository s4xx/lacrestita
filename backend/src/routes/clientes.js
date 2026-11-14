const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const c = await prisma.cliente.findMany({ orderBy: { totalComprado: "desc" } });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const c = await prisma.cliente.create({ data: req.body });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

