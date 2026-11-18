const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const c = await prisma.cliente.findMany({ orderBy: { id: "asc" } });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const c = await prisma.cliente.create({
      data: {
        nombre: b.nombre || '',
        telefono: b.telefono || '',
        direccion: b.direccion || '',
        tipo: b.tipo || 'EVENTUAL',
        saldo: parseFloat(b.saldo) || 0,
        nit: b.nit || null
      }
    });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const b = req.body;
    const data = {};
    if (b.nombre) data.nombre = b.nombre;
    if (b.telefono !== undefined) data.telefono = b.telefono;
    if (b.direccion !== undefined) data.direccion = b.direccion;
    if (b.tipo) data.tipo = b.tipo;
    if (b.saldo !== undefined) data.saldo = parseFloat(b.saldo);
    if (b.nit !== undefined) data.nit = b.nit;
    const c = await prisma.cliente.update({ where: { id }, data });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.cliente.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
