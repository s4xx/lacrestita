const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuthRole } = require("../middleware/requireRole");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const prisma = new PrismaClient();

const BACKUP_DIR = "/var/backups/pg";

// GET /api/backups - lista todos los backups disponibles
router.get("/", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith(".dump.gz") || f.endsWith(".dump") || f.endsWith(".sql"))
      .map(f => {
        const filepath = path.join(BACKUP_DIR, f);
        const stat = fs.statSync(filepath);
        // Extraer fecha del nombre: lacrestita_2026-11-15_020001.dump.gz
        const match = f.match(/lacrestita_(\d{4}-\d{2}-\d{2})_(\d{6})/);
        let fecha = '', hora = '';
        if (match) {
          fecha = match[1];
          hora = match[2].substring(0,2) + ':' + match[2].substring(2,4) + ':' + match[2].substring(4,6);
        }
        return {
          filename: f,
          fecha: fecha,
          hora: hora,
          tamano: stat.size,
          tamanoLegible: formatBytes(stat.size),
          creado: stat.mtime
        };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename));
    res.json(files);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/backups/crear - crear backup AHORA (manual)
router.post("/crear", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const filename = `lacrestita_${timestamp}.dump`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    
    execSync(`docker exec postgres pg_dump -U postgres -d lacrestita_prod -F c -f /tmp/${filename}`);
    execSync(`docker cp postgres:/tmp/${filename} "${filepath}"`);
    execSync(`docker exec postgres rm /tmp/${filename}`);
    execSync(`gzip -f "${filepath}"`);
    
    res.json({ ok: true, filename: filename + '.gz', message: 'Backup creado correctamente' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/backups/restaurar - restaurar un backup especifico
router.post("/restaurar", ...requireAuthRole(["ADMIN"]), async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: "Falta filename del backup" });
    
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: "Backup no encontrado" });
    
    // Primero crear un backup de seguridad antes de restaurar
    const safetyTimestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const safetyFilename = `lacrestita_${safetyTimestamp}_pre Restauracion.dump`;
    const safetyFilepath = path.join(BACKUP_DIR, safetyFilename);
    execSync(`docker exec postgres pg_dump -U postgres -d lacrestita_prod -F c -f /tmp/${safetyFilename}`);
    execSync(`docker cp postgres:/tmp/${safetyFilename} "${safetyFilepath}"`);
    execSync(`docker exec postgres rm /tmp/${safetyFilename}`);
    execSync(`gzip -f "${safetyFilepath}"`);
    
    // Restaurar el backup seleccionado
    // Si esta comprimido con gzip, descomprimir primero
    let dumpFile = filename;
    if (filename.endsWith('.gz')) {
      execSync(`gunzip -kf "${filepath}"`);
      dumpFile = filename.replace('.gz', '');
    }
    const dumpPath = path.join(BACKUP_DIR, dumpFile);
    
    // Copiar al contenedor y restaurar
    execSync(`docker cp "${dumpPath}" postgres:/tmp/${dumpFile}`);
    execSync(`docker exec postgres pg_restore -U postgres -d lacrestita_prod --clean --if-exists /tmp/${dumpFile}`);
    execSync(`docker exec postgres rm /tmp/${dumpFile}`);
    
    res.json({ 
      ok: true, 
      message: 'Backup restaurado correctamente',
      backupUsado: filename,
      safetyBackup: safetyFilename + '.gz'
    });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
