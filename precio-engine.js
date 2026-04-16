const axios = require("axios");

const PROMPT = `Extrae productos y precios de la imagen.
Devuelve SOLO JSON:
[{"producto":"nombre","precio":1234}]`;

function calcPrecio(base, cfg) {
  let p = base;
  p *= 1 + (cfg.ganancia || 0) / 100;
  p *= 1 + (cfg.iva || 0) / 100;

  return {
    precioLista: base,
    precioPublico: Math.round(p),
  };
}

// =============================
// GEMINI
// =============================

async function procesarGemini(b64, mime) {
  const r = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mime,
                data: b64,
              },
            },
            { text: PROMPT },
          ],
        },
      ],
    }
  );

  return r.data.candidates[0].content.parts[0].text;
}

// =============================
// PROCESAR IMAGEN
// =============================

async function procesarImagen(b64, mime, cfg) {
  try {
    const txt = await procesarGemini(b64, mime);

    const clean = txt.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);

    const productos = data.map(p => {
      const c = calcPrecio(p.precio || 0, cfg);

      return {
        nombre: p.producto,
        precio_lista: c.precioLista,
        precio_publico: c.precioPublico,
      };
    });

    return {
      ok: true,
      productos,
      cantidad: productos.length,
    };

  } catch (e) {
    console.error("❌ Error IA:", e.message);

    return {
      ok: false,
      error: "IA no disponible",
      productos: [],
      cantidad: 0,
    };
  }
}

// =============================
// CSV
// =============================

function procesarCSV(texto, cfg) {
  const lineas = texto.split("\n");

  const productos = lineas.map(l => {
    const [nombre, precio] = l.split(";");

    const c = calcPrecio(parseFloat(precio), cfg);

    return {
      nombre,
      precio_lista: c.precioLista,
      precio_publico: c.precioPublico,
    };
  });

  return {
    ok: true,
    productos,
    cantidad: productos.length,
  };
}

// =============================
// MANUAL
// =============================

function procesarManual(arr, cfg) {
  const productos = arr.map(p => {
    const c = calcPrecio(p.precio, cfg);

    return {
      nombre: p.nombre,
      precio_lista: c.precioLista,
      precio_publico: c.precioPublico,
    };
  });

  return {
    ok: true,
    productos,
    cantidad: productos.length,
  };
}

// =============================
// EXPORTS (CLAVE)
// =============================

module.exports = {
  procesarImagen,
  procesarCSV,
  procesarManual,
  calcPrecio,
  formatWhatsApp: () => "",
};