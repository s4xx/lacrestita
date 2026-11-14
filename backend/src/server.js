const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    system: "lacrestita",
    version: "1.0.0",
    database: "connected",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/productos", require("./routes/productos"));
app.use("/api/inventario", require("./routes/inventario"));
app.use("/api/ventas", require("./routes/ventas"));
app.use("/api/distribucion", require("./routes/distribucion"));
app.use("/api/mermas", require("./routes/mermas"));
app.use("/api/caja", require("./routes/caja"));
app.use("/api/trabajadores", require("./routes/trabajadores"));
app.use("/api/clientes", require("./routes/clientes"));
app.use("/api/pedidos", require("./routes/pedidos"));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor", message: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🥚 La Crestita backend corriendo en puerto ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});

