const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const {
  procesarImagen,
  procesarCSV,
  procesarManual,
  formatWhatsApp
} = require("./precio-engine");

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ======================================================
// CONFIGURACIÓN (editable desde la app)
// ======================================================

const CONFIG = {
  flete: 0,
  merma: 0,
  otros: 0,
  ganancia: 30,
  iibb: 0,
  iva: 21
};

// ======================================================
// 📊 ESTADÍSTICAS
// ======================================================

app.get("/api/estadisticas", (req, res) => {
  res.json({
    ok: true,
    totalProductos: 0,
    totalListas: 0,
    iaActiva: "Gemini"
  });
});

// ======================================================
// ❤️ HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({ ok: true, servicio: "Mundo Sin Gluten POS", version: "1.0.0" });
});

// ======================================================
// ⚙️ CONFIGURACIÓN
// ======================================================

app.get("/api/config", (req, res) => {
  res.json({ ok: true, config: CONFIG });
});

app.post("/api/config", (req, res) => {
  try {
    const campos = ["flete", "merma", "otros", "ganancia", "iibb", "iva"];
    campos.forEach(c => {
      if (req.body[c] !== undefined) CONFIG[c] = parseFloat(req.body[c]) || 0;
    });
    res.json({ ok: true, mensaje: "Configuración guardada", config: CONFIG });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ======================================================
// 📸 PROCESAR IMAGEN (multipart - para web)
// ======================================================

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
    console.error("❌ Error en procesar-imagen:", error.message);

    res.json({
      ok: false,
      error: "Error interno del servidor",
      productos: [],
      cantidad: 0
    });
  }
});

// ======================================================
// 📸 PROCESAR IMAGEN BASE64 (para app Android/iPhone)
// ======================================================

app.post("/api/procesar-imagen-base64", async (req, res) => {
  try {
    const { imagen, mimeType } = req.body;
    if (!imagen) {
      return res.json({ ok: false, error: "No se envió imagen", productos: [], cantidad: 0 });
    }

    const b64 = imagen.replace(/^data:image\/\w+;base64,/, "");
    const mime = mimeType || "image/jpeg";
    const resultado = await procesarImagen(b64, mime, CONFIG);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error en procesar-imagen-base64:", error.message);
    res.json({ ok: false, error: "Error interno del servidor", productos: [], cantidad: 0 });
  }
});

// ======================================================
// 📄 PROCESAR CSV
// ======================================================

app.post("/api/procesar-csv", async (req, res) => {
  try {
    const { texto } = req.body;
    const resultado = procesarCSV(texto, CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({ ok: false, error: "Error procesando CSV", productos: [], cantidad: 0 });
  }
});

// ======================================================
// ✏️ MANUAL
// ======================================================

app.post("/api/procesar-manual", async (req, res) => {
  try {
    const { productos } = req.body;
    const resultado = procesarManual(productos || [], CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({ ok: false, error: "Error manual", productos: [], cantidad: 0 });
  }
});

// ======================================================
// 🚀 SERVIDOR
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🌿 ════════════════════════════════");
  console.log("🌿  Mundo Sin Gluten - POS");
  console.log("🌿 ════════════════════════════════");
  console.log(`🌿  Servidor: http://localhost:${PORT}`);
  console.log(`🌿  IA activa: Gemini`);
  console.log("🌿 ════════════════════════════════");
});