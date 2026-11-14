const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // Sucursales
  const central = await prisma.sucursal.upsert({ where: { nombre: "Central" }, update: {}, create: { nombre: "Central" } });
  const norte = await prisma.sucursal.upsert({ where: { nombre: "Norte" }, update: {}, create: { nombre: "Norte" } });
  const sur = await prisma.sucursal.upsert({ where: { nombre: "Sur" }, update: {}, create: { nombre: "Sur" } });

  // Categoría
  const huevos = await prisma.categoria.upsert({ where: { nombre: "Huevos" }, update: {}, create: { nombre: "Huevos", icon: "🥚", color: "#FBBF24" } });
  const abarrotes = await prisma.categoria.upsert({ where: { nombre: "Abarrotes" }, update: {}, create: { nombre: "Abarrotes", icon: "📦", color: "#3B82F6" } });

  // Productos
  const productos = [
    { nombre: "Huevo 1ra Calidad", precioMaple: 30, precioUnidad: 1.2, icon: "🥚", categoriaId: huevos.id },
    { nombre: "Huevo 2da Calidad", precioMaple: 25, precioUnidad: 1.0, icon: "🥚", categoriaId: huevos.id },
    { nombre: "Huevo 3ra Calidad", precioMaple: 20, precioUnidad: 0.8, icon: "🥚", categoriaId: huevos.id },
    { nombre: "Huevos Cruceñas", precioMaple: 32, precioUnidad: 1.3, icon: "🌅", categoriaId: huevos.id },
    { nombre: "Huevos Paceñas", precioMaple: 32, precioUnidad: 1.3, icon: "🏔️", categoriaId: huevos.id },
    { nombre: "Huevos Sucios", precioMaple: 18, precioUnidad: 0.7, icon: "🪺", categoriaId: huevos.id },
  ];
  for (const p of productos) {
    await prisma.producto.create({ data: p }).catch(() => {});
  }

  // Usuarios
  const adminPass = await bcrypt.hash("admin123", 10);
  const gerentePass = await bcrypt.hash("gerente123", 10);
  const encargadoPass = await bcrypt.hash("enc123", 10);
  const carlosPass = await bcrypt.hash("dist123", 10);

  await prisma.usuario.upsert({ where: { email: "admin@lacrestita.com" }, update: {}, create: { email: "admin@lacrestita.com", password: adminPass, name: "Admin La Crestita", role: "ADMIN" } });
  await prisma.usuario.upsert({ where: { email: "gerente@lacrestita.com" }, update: {}, create: { email: "gerente@lacrestita.com", password: gerentePass, name: "Gerente La Crestita", role: "GERENTE" } });
  await prisma.usuario.upsert({ where: { email: "encargado.tienda@lacrestita.com" }, update: {}, create: { email: "encargado.tienda@lacrestita.com", password: encargadoPass, name: "Carmen Sosa", role: "ENCARGADO_TIENDA" } });
  await prisma.usuario.upsert({ where: { email: "carlos@lacrestita.com" }, update: {}, create: { email: "carlos@lacrestita.com", password: carlosPass, name: "Carlos Mamani", role: "DISTRIBUIDOR", distribuidorId: "d1", distribuidorNombre: "Carlos Mamani" } });

  console.log("✅ Seed completado: 3 sucursales, 2 categorías, 6 productos, 4 usuarios");
}

main().catch(console.error).finally(() => prisma.$disconnect());

