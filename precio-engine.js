const axios = require("axios");

// ============================================
// PROMPT MEJORADO - detecta todos los productos
// y usa precio UNITARIO, no importe
// ============================================
const PROMPT = `Eres un experto en leer facturas, presupuestos y listas de precios argentinas.
Extrae TODOS los productos con su precio UNITARIO (no el importe total).
Responde SOLO con JSON válido, sin markdown, sin backticks, sin texto extra.
Formato exacto:
[{"producto":"NOMBRE COMPLETO","precio":1234.56}]
REGLAS:
- Usá el precio UNITARIO de cada producto, no el importe (cantidad x precio)
- Extraé TODOS los productos, no te saltees ninguno
- Si no podés leer un precio, poné 0
- Solo JSON, nada más`;

// ============================================
// CALCULAR PRECIO AL PÚBLICO
// ============================================
function calcPrecio(base, cfg) {
  let p = base;
  p *= 1 + (cfg.flete || 0) / 100;
  p *= 1 + (cfg.merma || 0) / 100;
  p *= 1 + (cfg.otros || 0) / 100;
  p *= 1 + (cfg.ganancia || 0) / 100;
  p *= 1 + (cfg.iibb || 0) / 100;
  p *= 1 + (cfg.iva || 0) / 100;

  return {
    precioLista: base,
    precioPublico: Math.round(p),
    margen: base > 0 ? Math.round(((p - base) / base) * 100 * 10) / 10 : 0,
  };
}

// ============================================
// GEMINI (gratis)
// ============================================
async function procesarGemini(b64, mime) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_KEY}`;

  const r = await axios.post(url, {
    contents: [{
      parts: [
        { inline_data: { mime_type: mime, data: b64 } },
        { text: PROMPT },
      ],
    }],
  }, { timeout: 60000 });

  return r.data.candidates[0].content.parts[0].text;
}

// ============================================
// PROCESAR IMAGEN
// ============================================
async function procesarImagen(b64, mime, cfg) {
  try {
    const txt = await procesarGemini(b64, mime);

    // Limpiar respuesta de Gemini
    let clean = txt.replace(/```json/g, "").replace(/```/g, "").trim();

    // A veces Gemini agrega texto antes o después del JSON
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1);
    }

    const data = JSON.parse(clean);

    if (!Array.isArray(data) || data.length === 0) {
      return { ok: false, error: "No se detectaron productos", productos: [], cantidad: 0 };
    }

    const productos = data
      .filter(p => p.producto && p.producto.length > 0)
      .map(p => {
        const c = calcPrecio(Number(p.precio) || 0, cfg);
        return {
          nombre: p.producto,
          precio_lista: c.precioLista,
          precio_publico: c.precioPublico,
          margen: c.margen,
          unidad: p.unidad || "un",
          codigo: p.codigo || "",
        };
      });

    return {
      ok: true,
      productos,
      cantidad: productos.length,
      metodo: "Gemini",
    };

  } catch (e) {
    console.error("❌ Error IA:", e.message);
    return {
      ok: false,
      error: "IA no disponible: " + e.message,
      productos: [],
      cantidad: 0,
    };
  }
}

// ============================================
// CSV
// ============================================
function procesarCSV(texto, cfg) {
  if (!texto || !texto.trim()) {
    return { ok: false, error: "Texto vacío", productos: [], cantidad: 0 };
  }

  const lineas = texto.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // Detectar si primera línea es encabezado
  const primera = lineas[0].toLowerCase();
  const inicio = (primera.includes("producto") || primera.includes("nombre") || primera.includes("precio")) ? 1 : 0;

  // Detectar separador
  let sep = ";";
  if (lineas[0].includes("\t")) sep = "\t";
  else if (!lineas[0].includes(";") && lineas[0].includes(",")) sep = ",";

  const productos = [];

  for (let i = inicio; i < lineas.length; i++) {
    const partes = lineas[i].split(sep).map(p => p.trim().replace(/^["']|["']$/g, ""));
    if (partes.length < 2) continue;

    const nombre = partes[0];
    const precio = parseFloat(partes[1].replace(/[$.]/g, "").replace(",", "."));

    if (nombre && !isNaN(precio) && precio > 0) {
      const c = calcPrecio(precio, cfg);
      productos.push({
        nombre,
        precio_lista: c.precioLista,
        precio_publico: c.precioPublico,
        margen: c.margen,
      });
    }
  }

  if (productos.length === 0) {
    return { ok: false, error: "No se detectaron productos. Formato: Nombre;Precio", productos: [], cantidad: 0 };
  }

  return { ok: true, productos, cantidad: productos.length, metodo: "CSV" };
}

// ============================================
// MANUAL
// ============================================
function procesarManual(arr, cfg) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { ok: false, error: "Sin productos", productos: [], cantidad: 0 };
  }

  const productos = arr
    .filter(p => p.nombre && p.precio > 0)
    .map(p => {
      const c = calcPrecio(Number(p.precio), cfg);
      return {
        nombre: p.nombre,
        precio_lista: c.precioLista,
        precio_publico: c.precioPublico,
        margen: c.margen,
      };
    });

  return { ok: true, productos, cantidad: productos.length, metodo: "Manual" };
}

// ============================================
// WHATSAPP FORMAT
// ============================================
function formatWhatsApp(productos, nombre) {
  if (!productos || !productos.length) return "No se detectaron productos.";
  const f = n => "$" + n.toLocaleString("es-AR");
  let m = `🌿 *${nombre || "Mundo Sin Gluten"}*\n━━━━━━━━━━━━━━━━━━━\n\n`;
  productos.forEach((p, i) => {
    m += `*${i + 1}. ${p.nombre}*\n`;
    m += `   Lista: ${f(p.precio_lista)}\n`;
    m += `   👉 *Público: ${f(p.precio_publico)}*\n\n`;
  });
  m += `━━━━━━━━━━━━━━━━━━━\n✅ ${productos.length} productos`;
  return m;
}

module.exports = {
  procesarImagen,
  procesarCSV,
  procesarManual,
  calcPrecio,
  formatWhatsApp,
};
