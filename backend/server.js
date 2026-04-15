const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const {
  procesarImagen,
  procesarCSV,
  procesarManual,
  formatWhatsApp,
} = require("./precio-engine");

const app = express();
const upload = multer();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ============================================
// RUTA BASE (IMPORTANTE PARA RENDER)
// ============================================
app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Mundo Sin Gluten API funcionando",
    endpoints: [
      "/api/health",
      "/api/config",
      "/api/procesar-imagen",
      "/api/procesar-imagen-base64",
      "/api/procesar-csv",
      "/api/procesar-manual"
    ]
  });
});

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
  flete: 0,
  merma: 0,
  otros: 0,
  ganancia: 30,
  iibb: 0,
  iva: 21,
};

// ============================================
// ESTADÍSTICAS
// ============================================
app.get("/api/estadisticas", (req, res) => {
  res.json({
    ok: true,
    totalProductos: 0,
    totalListas: 0,
    iaActiva: "Gemini"
  });
});

// ============================================
// CONFIGURACIÓN GET
// ============================================
app.get("/api/config", (req, res) => {
  res.json({ ok: true, config: CONFIG });
});

// CONFIGURACIÓN POST
app.post("/api/config", (req, res) => {
  try {
    const campos = ["flete", "merma", "otros", "ganancia", "iibb", "iva"];

    campos.forEach(c => {
      if (req.body[c] !== undefined) {
        CONFIG[c] = parseFloat(req.body[c]) || 0;
      }
    });

    res.json({
      ok: true,
      mensaje: "Configuración guardada",
      config: CONFIG
    });

  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ============================================
// PROCESAR IMAGEN (multipart)
// ============================================
app.post("/api/procesar-imagen", upload.single("imagen"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        ok: false,
        error: "No se envió ninguna imagen",
        productos: [],
        cantidad: 0
      });
    }

    const b64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype;

    const resultado = await procesarImagen(b64, mime, CONFIG);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.json({
      ok: false,
      error: "Error interno del servidor",
      productos: [],
      cantidad: 0
    });
  }
});

// ============================================
// PROCESAR IMAGEN BASE64 (APP MOBILE)
// ============================================
app.post("/api/procesar-imagen-base64", async (req, res) => {
  try {
    const { imagen, mimeType } = req.body;

    if (!imagen) {
      return res.json({
        ok: false,
        error: "No se envió imagen",
        productos: [],
        cantidad: 0
      });
    }

    const b64 = imagen.replace(/^data:image\/\w+;base64,/, "");
    const mime = mimeType || "image/jpeg";

    const resultado = await procesarImagen(b64, mime, CONFIG);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.json({
      ok: false,
      error: "Error interno del servidor",
      productos: [],
      cantidad: 0
    });
  }
});

// ============================================
// CSV
// ============================================
app.post("/api/procesar-csv", (req, res) => {
  try {
    const resultado = procesarCSV(req.body.texto, CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({
      ok: false,
      error: "Error procesando CSV",
      productos: [],
      cantidad: 0
    });
  }
});

// ============================================
// MANUAL
// ============================================
app.post("/api/procesar-manual", (req, res) => {
  try {
    const resultado = procesarManual(req.body.productos || [], CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({
      ok: false,
      error: "Error manual",
      productos: [],
      cantidad: 0
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    servicio: "Mundo Sin Gluten POS",
    version: "1.0.0"
  });
});

// ============================================
// SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌿 Mundo Sin Gluten POS");
  console.log("🌿 Servidor corriendo en puerto " + PORT);
  console.log("🌿 IA: Gemini");
});