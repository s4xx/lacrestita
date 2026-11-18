const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.usuario.findFirst({
      where: { email: email?.toLowerCase().trim(), active: true }
    });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales incorrectas" });
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, distribuidorId: user.distribuidorId, distribuidorNombre: user.distribuidorNombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, distribuidorId: user.distribuidorId, distribuidorNombre: user.distribuidorNombre }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", require("../middleware/auth").auth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register  (protegido: ADMIN puede crear cualquier rol, GERENTE solo DISTRIBUIDOR/ENCARGADO_TIENDA)
router.post("/register", require("../middleware/auth").auth, async (req, res) => {
  try {
    const creatorRole = req.user.role;
    const { name, email, password, role, distribuidorId, distribuidorNombre } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Faltan datos: name, email, password son obligatorios" });
    }
    const emailNorm = email.toLowerCase().trim();
    if (password.length < 4) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }
    
    const finalRole = (role || "ENCARGADO_TIENDA").toUpperCase();
    
    // Validaciones de permisos por rol del creador
    if (creatorRole === "GERENTE") {
      // GERENTE solo puede crear DISTRIBUIDOR o ENCARGADO_TIENDA
      if (finalRole !== "DISTRIBUIDOR" && finalRole !== "ENCARGADO_TIENDA") {
        return res.status(403).json({ error: "Como GERENTE solo podés crear DISTRIBUIDOR o ENCARGADO_TIENDA", requested_role: finalRole });
      }
    } else if (creatorRole !== "ADMIN") {
      return res.status(403).json({ error: "Solo ADMIN o GERENTE pueden registrar usuarios", your_role: creatorRole });
    }
    
    // Verificar email no duplicado
    const existe = await prisma.usuario.findFirst({ where: { email: emailNorm } });
    if (existe) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email", email: emailNorm });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const nuevo = await prisma.usuario.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        password: hash,
        role: finalRole,
        distribuidorId: distribuidorId || null,
        distribuidorNombre: distribuidorNombre || null,
        active: true
      },
      select: { id: true, name: true, email: true, role: true, distribuidorId: true, distribuidorNombre: true, active: true, createdAt: true }
    });
    
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
