const express = require("express");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const {
  procesarImagen,
  procesarCSV,
  procesarManual
} = require("./precio-engine");

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// CONFIG
const CONFIG = {
  flete: 0,
  merma: 0,
  otros: 0,
  ganancia: 30,
  iibb: 0,
  iva: 21,
};

// 👉 RUTA PRINCIPAL (TEST)
app.get("/", (req, res) => {
  res.send("API funcionando OK");
});

// HEALTH
app.get("/api/health", (req, res) => {
  res.json({ ok: true, servicio: "Mundo Sin Gluten POS", version: "1.0.0" });
});

// CONFIG
app.get("/api/config", (req, res) => {
  res.json({ ok: true, config: CONFIG });
});

// PROCESAR IMAGEN BASE64
app.post("/api/procesar-imagen-base64", async (req, res) => {
  try {
    const { imagen, mimeType } = req.body;

    if (!imagen) {
      return res.json({ ok: false, error: "No se envió imagen" });
    }

    const b64 = imagen.replace(/^data:image\/\w+;base64,/, "");
    const mime = mimeType || "image/jpeg";

    const resultado = await procesarImagen(b64, mime, CONFIG);
    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.json({ ok: false, error: "Error interno" });
  }
});

// CSV
app.post("/api/procesar-csv", (req, res) => {
  try {
    const resultado = procesarCSV(req.body.texto, CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({ ok: false, error: "Error CSV" });
  }
});

// MANUAL
app.post("/api/procesar-manual", (req, res) => {
  try {
    const resultado = procesarManual(req.body.productos || [], CONFIG);
    res.json(resultado);
  } catch (error) {
    res.json({ ok: false, error: "Error manual" });
  }
});

// SERVIDOR
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
