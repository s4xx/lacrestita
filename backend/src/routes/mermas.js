const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const mermas = await prisma.merma.findMany({ orderBy: { fecha: "desc" }, take: 200 });
    res.json(mermas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const m = await prisma.merma.create({ data: req.body });
    res.status(201).json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

