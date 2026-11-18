const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const t = await prisma.trabajador.findMany({ orderBy: { id: "asc" } });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    let sucId = null;
    if (b.sucursal) {
      const suc = await prisma.sucursal.findFirst({ where: { nombre: b.sucursal } });
      if (suc) sucId = suc.id;
    }
    const t = await prisma.trabajador.create({
      data: {
        nombre: b.nombre || '',
        rol: b.rol || 'DISTRIBUIDOR',
        telefono: b.telefono || '',
        direccion: b.direccion || '',
        salario: parseFloat(b.salario) || 0,
        estado: b.estado || 'ACTIVO',
        sucursalId: sucId
      }
    });
    res.status(201).json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const b = req.body;
    const data = {};
    if (b.nombre) data.nombre = b.nombre;
    if (b.rol) data.rol = b.rol;
    if (b.telefono !== undefined) data.telefono = b.telefono;
    if (b.direccion !== undefined) data.direccion = b.direccion;
    if (b.salario !== undefined) data.salario = parseFloat(b.salario);
    if (b.estado) data.estado = b.estado;
    const t = await prisma.trabajador.update({ where: { id }, data });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.trabajador.update({ where: { id }, data: { estado: 'INACTIVO' } });
    res.json({ ok: true, message: 'Trabajador desactivado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
