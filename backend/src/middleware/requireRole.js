const auth = require("./auth").auth;

// Middleware que requiere que el usuario tenga uno de los roles permitidos
// Uso: router.get("/...", requireAuth, requireRole(["ADMIN", "GERENTE"]), handler)
function requireRole(roles) {
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }
    if (!roles || roles.length === 0) return next();
    if (roles.indexOf(req.user.role) < 0) {
      return res.status(403).json({ error: "Permisos insuficientes", required: roles, your_role: req.user.role });
    }
    next();
  };
}

// Función combinada: auth + role en una sola
function requireAuthRole(roles) {
  return [auth, requireRole(roles)];
}

module.exports = { auth, requireRole, requireAuthRole };
