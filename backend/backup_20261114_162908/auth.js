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

module.exports = router;

