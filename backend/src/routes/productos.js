const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const productos = await prisma.$queryRawUnsafe('SELECT * FROM productos WHERE activo = true ORDER BY id');
    res.json(productos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const b = req.body;
    const r = await prisma.$queryRawUnsafe(
      'INSERT INTO productos (nombre, "precioMaple", "precioUnidad", icon, "categoriaId", "stockBajo", "diasVencimiento", "unidadesPorMaple", activo, "precioRecoger", "precioDomicilio") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      b.nombre || 'Producto', parseFloat(b.precioMaple)||0, parseFloat(b.precioUnidad)||0,
      b.icon || '📦', parseInt(b.categoriaId)||1, parseInt(b.stockBajo)||60,
      parseInt(b.diasVencimiento)||21, parseInt(b.unidadesPorMaple)||30, true,
      parseFloat(b.precioRecoger)||parseFloat(b.precioMaple)||0,
      parseFloat(b.precioDomicilio)||Math.ceil((parseFloat(b.precioMaple)||0)*1.1)
    );
    res.status(201).json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT con precioRecoger y precioDomicilio
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const b = req.body;
    const sets = [];
    const vals = [];
    let idx = 1;
    if (b.nombre) { sets.push('nombre = $'+idx); vals.push(b.nombre); idx++; }
    if (b.precioMaple !== undefined) { sets.push('"precioMaple" = $'+idx); vals.push(parseFloat(b.precioMaple)); idx++; }
    if (b.precioUnidad !== undefined) { sets.push('"precioUnidad" = $'+idx); vals.push(parseFloat(b.precioUnidad)); idx++; }
    if (b.precioRecoger !== undefined) { sets.push('"precioRecoger" = $'+idx); vals.push(parseFloat(b.precioRecoger)); idx++; }
    if (b.precioDomicilio !== undefined) { sets.push('"precioDomicilio" = $'+idx); vals.push(parseFloat(b.precioDomicilio)); idx++; }
    if (b.icon) { sets.push('icon = $'+idx); vals.push(b.icon); idx++; }
    if (b.stockBajo !== undefined) { sets.push('"stockBajo" = $'+idx); vals.push(parseInt(b.stockBajo)); idx++; }
    if (b.diasVencimiento !== undefined) { sets.push('"diasVencimiento" = $'+idx); vals.push(parseInt(b.diasVencimiento)); idx++; }
    if (b.activo !== undefined) { sets.push('activo = $'+idx); vals.push(!!b.activo); idx++; }
    if (sets.length === 0) return res.json({ ok: true });
    vals.push(id);
    const r = await prisma.$queryRawUnsafe('UPDATE productos SET ' + sets.join(', ') + ' WHERE id = $'+idx+' RETURNING *', ...vals);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.$queryRawUnsafe('UPDATE productos SET activo = false WHERE id = $1', id);
    res.json({ ok: true, message: 'Producto desactivado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
