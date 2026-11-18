const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    system: "lacrestita",
    version: "1.4.0",
    database: "connected",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/productos", require("./routes/productos"));
app.use("/api/inventario", require("./routes/inventario"));
app.use("/api/ventas", require("./routes/ventas"));
app.use("/api/distribucion", require("./routes/distribucion"));
app.use("/api/mermas", require("./routes/mermas"));
app.use("/api/caja", require("./routes/caja"));
app.use("/api/trabajadores", require("./routes/trabajadores"));
app.use("/api/clientes", require("./routes/clientes"));
app.use("/api/pedidos", require("./routes/pedidos"));
app.use("/api/traspasos", require("./routes/traspasos"));
app.use("/api/ajustes", require("./routes/ajustes"));
app.use("/api/arqueos", require("./routes/arqueos"));
app.use("/api/sucursales", require("./routes/sucursales"));
app.use("/api/categorias", require("./routes/categorias"));
app.use("/api/movimientos", require("./routes/movimientos"));
app.use("/api/tienda", require("./routes/tienda"));
app.use("/api/backups", require("./routes/backups"));  // NUEVO v1.4

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor", message: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🥚 La Crestita backend v1.4 corriendo en puerto ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`💾 Backups: /api/backups (ADMIN)`);
});
