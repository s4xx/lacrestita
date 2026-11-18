const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");

const router = express.Router();
const prisma = new PrismaClient();

// SELECT sin password (para no exponer hashes)
const PUBLIC_FIELDS = { id: true, name: true, email: true, role: true, distribuidorId: true, distribuidorNombre: true, active: true, createdAt: true, updatedAt: true };

// GET /api/usuarios  - lista todos los usuarios (sin password)
// Requiere ADMIN o GERENTE
router.get("/", ...requireAuthRole(["ADMIN", "GERENTE"]), async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({ select: PUBLIC_FIELDS, orderBy: { id: "asc" } });
    // Si es GERENTE, filtrar: solo ve DISTRIBUIDOR y ENCARGADO_TIENDA (no ve ADMIN/GERENTE)
    if (req.user.role === "GERENTE") {
      const filtered = users.filter(u => u.role === "DISTRIBUIDOR" || u.role === "ENCARGADO_TIENDA");
      return res.json(filtered);
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/usuarios/:id
router.get("/:id", ...requireAuthRole(["ADMIN", "GERENTE"]), async (req, res) => {
  try {
    const u = await prisma.usuario.findUnique({ where: { id: parseInt(req.params.id) }, select: PUBLIC_FIELDS });
    if (!u) return res.status(404).json({ error: "Usuario no encontrado" });
    // GERENTE no puede ver ADMIN/GERENTE
    if (req.user.role === "GERENTE" && (u.role === "ADMIN" || u.role === "GERENTE")) {
      return res.status(403).json({ error: "Sin permisos para ver este usuario" });
    }
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios  - crear usuario (igual que /api/auth/register pero en su endpoint)
router.post("/", ...requireAuthRole(["ADMIN", "GERENTE"]), async (req, res) => {
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
    
    if (creatorRole === "GERENTE") {
      if (finalRole !== "DISTRIBUIDOR" && finalRole !== "ENCARGADO_TIENDA") {
        return res.status(403).json({ error: "Como GERENTE solo podés crear DISTRIBUIDOR o ENCARGADO_TIENDA", requested_role: finalRole });
      }
    }
    
    const existe = await prisma.usuario.findFirst({ where: { email: emailNorm } });
    if (existe) {
      return res.status(409).json({ error: "Ya existe un usuario con ese email", email: emailNorm });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const nuevo = await prisma.usuario.create({
      data: { name: name.trim(), email: emailNorm, password: hash, role: finalRole, distribuidorId: distribuidorId || null, distribuidorNombre: distribuidorNombre || null, active: true },
      select: PUBLIC_FIELDS
    });
    
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/usuarios/:id  - actualizar usuario
router.put("/:id", ...requireAuthRole(["ADMIN", "GERENTE"]), async (req, res) => {
  try {
    const creatorRole = req.user.role;
    const id = parseInt(req.params.id);
    const { name, email, password, role, distribuidorId, distribuidorNombre, active } = req.body;
    
    // Verificar que el usuario existe
    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Usuario no encontrado" });
    
    // GERENTE no puede editar ADMIN/GERENTE ni cambiar a esos roles
    if (creatorRole === "GERENTE") {
      if (existente.role === "ADMIN" || existente.role === "GERENTE") {
        return res.status(403).json({ error: "Sin permisos para editar este usuario" });
      }
      if (role && (role === "ADMIN" || role === "GERENTE")) {
        return res.status(403).json({ error: "Como GERENTE no podés asignar el rol " + role });
      }
    }
    
    const data = {};
    if (name) data.name = name.trim();
    if (email) data.email = email.toLowerCase().trim();
    if (role) data.role = role.toUpperCase();
    if (distribuidorId !== undefined) data.distribuidorId = distribuidorId || null;
    if (distribuidorNombre !== undefined) data.distribuidorNombre = distribuidorNombre || null;
    if (active !== undefined) data.active = !!active;
    if (password && password.length >= 4) {
      data.password = await bcrypt.hash(password, 10);
    }
    
    const actualizado = await prisma.usuario.update({ where: { id }, data, select: PUBLIC_FIELDS });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id  - desactivar (no borrar físicamente, para preservar referencias)
router.delete("/:id", ...requireAuthRole(["ADMIN", "GERENTE"]), async (req, res) => {
  try {
    const creatorRole = req.user.role;
    const id = parseInt(req.params.id);
    
    if (id === req.user.id) {
      return res.status(400).json({ error: "No podés eliminar tu propia cuenta" });
    }
    
    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: "Usuario no encontrado" });
    
    if (creatorRole === "GERENTE" && (existente.role === "ADMIN" || existente.role === "GERENTE")) {
      return res.status(403).json({ error: "Sin permisos para eliminar este usuario" });
    }
    
    // Soft delete: marcar active=false (preserva integridad referencial)
    const desactivado = await prisma.usuario.update({ where: { id }, data: { active: false }, select: PUBLIC_FIELDS });
    res.json({ ok: true, message: "Usuario desactivado", user: desactivado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
