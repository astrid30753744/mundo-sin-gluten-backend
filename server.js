const cors = require("cors");
const express = require("express");
require("dotenv").config();

const app = express();
const BODY_LIMIT = process.env.MAX_IMAGE_BODY_SIZE || "35mb";
const MIME_TYPES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const CONFIG = {
  flete: 0,
  merma: 0,
  otros: 0,
  ganancia: 30,
  iibb: 0,
  iva: 21,
};

app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));

function extraerTextoOpenAI(data) {
  const content = data?.choices?.[0]?.message?.content;
  const outputText = data?.output_text;

  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text || "";
        return "";
      })
      .join("\n");
  }

  return "";
}

function limpiarJSON(texto) {
  return String(texto || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function obtenerPrimerTextoValido(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function normalizarPrecio(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const limpio = value.replace(/[^\d,.-]/g, "").trim();

  if (!limpio) {
    return NaN;
  }

  const sinSeparadores = limpio.replace(/[.,](?=\d{3}(?:\D|$))/g, "");
  const normalizado = sinSeparadores.replace(",", ".");
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? Math.round(numero) : NaN;
}

function normalizarPorcentaje(value, fallback = 0) {
  const numero =
    typeof value === "number" ? value : Number(String(value || "").replace(",", "."));

  return Number.isFinite(numero) ? numero : fallback;
}

function extraerListaProductos(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.productos)) return parsed.productos;
  if (Array.isArray(parsed?.items)) return parsed.items;
  if (Array.isArray(parsed?.resultados)) return parsed.resultados;
  if (Array.isArray(parsed?.resultado?.productos)) return parsed.resultado.productos;
  if (Array.isArray(parsed?.resultado?.items)) return parsed.resultado.items;
  if (Array.isArray(parsed?.data?.productos)) return parsed.data.productos;
  if (Array.isArray(parsed?.data?.items)) return parsed.data.items;

  return [];
}

function obtenerPayloadImagen(body) {
  return {
    imagenBase64:
      body?.imagenBase64 ||
      body?.imageBase64 ||
      body?.base64 ||
      body?.imagen ||
      body?.image ||
      "",
    mimeType:
      body?.mimeType ||
      body?.contentType ||
      body?.tipoMime ||
      body?.type ||
      "image/jpeg",
  };
}

function normalizarMimeType(value) {
  const mime = String(value || "image/jpeg").trim().toLowerCase();

  return MIME_TYPES_PERMITIDOS.has(mime) ? mime : "image/jpeg";
}

function normalizarProductoDetectado(item, index) {
  const textoDetectado = obtenerPrimerTextoValido(
    item?.texto_detectado,
    item?.texto,
    item?.nombre,
    item?.producto,
    item?.descripcion
  );
  const precio = normalizarPrecio(
    item?.precio ?? item?.valor ?? item?.price ?? item?.importe
  );

  if (
    !textoDetectado ||
    !Number.isFinite(precio) ||
    precio <= 0 ||
    esBasuraDetectada(textoDetectado)
  ) {
    return null;
  }

  return {
    id: `${Date.now()}-${index}`,
    texto_detectado: textoDetectado,
    precio,
  };
}

function normalizarConfig(config = {}) {
  return {
    flete: normalizarPorcentaje(config.flete, CONFIG.flete),
    merma: normalizarPorcentaje(config.merma, CONFIG.merma),
    otros: normalizarPorcentaje(config.otros, CONFIG.otros),
    ganancia: normalizarPorcentaje(config.ganancia, CONFIG.ganancia),
    iibb: normalizarPorcentaje(config.iibb, CONFIG.iibb),
    iva: normalizarPorcentaje(config.iva, CONFIG.iva),
  };
}

function calcularPrecioPublico(precioBase, config) {
  let precio = Number(precioBase) || 0;

  precio *= 1 + config.flete / 100;
  precio *= 1 + config.merma / 100;
  precio *= 1 + config.otros / 100;
  precio *= 1 + config.ganancia / 100;
  precio *= 1 + config.iibb / 100;
  precio *= 1 + config.iva / 100;

  const precioFinal = Math.round(precio);

  return {
    precio_base: Math.round(Number(precioBase) || 0),
    precio_publico: precioFinal,
    margen_pct:
      precioBase > 0
        ? Math.round((((precioFinal - precioBase) / precioBase) * 100) * 10) / 10
        : 0,
  };
}

function normalizarProductoCalculo(item, index) {
  const textoDetectado = obtenerPrimerTextoValido(
    item?.texto_detectado,
    item?.texto,
    item?.nombre,
    item?.producto,
    item?.descripcion
  );
  const precio = normalizarPrecio(
    item?.precio ?? item?.valor ?? item?.price ?? item?.importe ?? item?.precio_base
  );
  const validado = item?.validado ?? true;

  if (!textoDetectado || !Number.isFinite(precio) || precio <= 0 || validado === false) {
    return null;
  }

  return {
    id: String(item?.id || `calc-${Date.now()}-${index}`),
    texto_detectado: textoDetectado,
    precio,
  };
}

function generarTextoWhatsapp(productos) {
  if (!Array.isArray(productos) || !productos.length) {
    return "No hay productos calculados.";
  }

  const fmt = (n) => `$${Math.round(n).toLocaleString("es-AR")}`;
  let mensaje = "Mundo Sin Gluten\n\n";

  productos.forEach((producto, index) => {
    mensaje += `${index + 1}. ${producto.texto_detectado}\n`;
    mensaje += `Lista: ${fmt(producto.precio_base)}\n`;
    mensaje += `Publico: ${fmt(producto.precio_publico)}\n\n`;
  });

  return mensaje.trim();
}

function esBasuraDetectada(texto) {
  const value = String(texto || "").trim().toLowerCase();

  if (!value || value.length < 4) return true;
  if (/^\d+$/.test(value)) return true;
  if (/^\d+\s*(u|unidades?)$/i.test(value)) return true;
  if (/^(u|unidades?|gr|grs|kg|ml|lts)$/i.test(value)) return true;
  if (/^x\s*\d+$/i.test(value)) return true;
  if (/^\d+\s*(gr|grs|kg|ml|lts)$/i.test(value)) return true;

  return false;
}

app.get("/", (_req, res) => {
  res.send("API Mundo Sin Gluten OK");
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "Mundo Sin Gluten",
    version: "4.0.0",
    proveedorIA: "OpenAI Vision",
  });
});

app.get("/api/config", (_req, res) => {
  res.json({ ok: true, config: CONFIG });
});

app.post("/api/detectar-productos-ia", async (req, res) => {
  try {
    const { imagenBase64, mimeType } = obtenerPayloadImagen(req.body || {});

    if (!imagenBase64) {
      return res.status(400).json({
        ok: false,
        error: "Falta imagenBase64.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Falta OPENAI_API_KEY en el archivo .env.",
      });
    }

    const mime = normalizarMimeType(mimeType);
    const base64Limpia = String(imagenBase64).replace(/^data:[^;]+;base64,/, "");

    if (!base64Limpia) {
      return res.status(400).json({
        ok: false,
        error: "La imagen recibida esta vacia.",
      });
    }

    const dataUrl = `data:${mime};base64,${base64Limpia}`;

    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extrae productos y precios desde imagenes. Responde solo JSON valido.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  "Lee la imagen y extrae productos con su precio.",
                  "No inventes nombres.",
                  "No completes palabras faltantes.",
                  "Devuelve el texto exacto.",
                  "Si el nombre esta cortado, dejalo cortado.",
                  "Ignora 24U, x12, 500gr y similares si no son claramente el producto.",
                  'Formato: {"productos":[{"texto_detectado":"string","precio":1234}]}',
                  "Precio como numero entero.",
                  "Solo JSON valido.",
                ].join("\n"),
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return res.status(500).json({
        ok: false,
        error: data?.error?.message || "La IA devolvio un error.",
      });
    }

    const jsonCrudo = limpiarJSON(extraerTextoOpenAI(data));
    let parsed;

    try {
      parsed = JSON.parse(jsonCrudo);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "La IA respondio un JSON invalido.",
      });
    }

    const productos = extraerListaProductos(parsed)
      .map((item, index) => normalizarProductoDetectado(item, index))
      .filter(Boolean);

    return res.json({
      ok: true,
      productos,
      cantidad: productos.length,
      mimeType: mime,
    });
  } catch (error) {
    console.error("Error en /api/detectar-productos-ia:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno en la deteccion con IA.",
    });
  }
});

app.post("/api/calcular-precios", (req, res) => {
  try {
    const items = extraerListaProductos(req.body || {});
    const config = normalizarConfig(req.body?.config || CONFIG);
    const productosEntrada = items
      .map((item, index) => normalizarProductoCalculo(item, index))
      .filter(Boolean);

    if (!productosEntrada.length) {
      return res.status(400).json({
        ok: false,
        error: "No hay productos validos para calcular.",
      });
    }

    const productos = productosEntrada.map((producto) => ({
      id: producto.id,
      texto_detectado: producto.texto_detectado,
      ...calcularPrecioPublico(producto.precio, config),
    }));

    const resumen = productos.reduce(
      (acc, producto) => {
        acc.total_base += producto.precio_base;
        acc.total_publico += producto.precio_publico;
        return acc;
      },
      {
        cantidad: productos.length,
        total_base: 0,
        total_publico: 0,
      }
    );

    return res.json({
      ok: true,
      config,
      productos,
      resumen: {
        ...resumen,
        diferencia_total: resumen.total_publico - resumen.total_base,
      },
      whatsapp: generarTextoWhatsapp(productos),
    });
  } catch (error) {
    console.error("Error en /api/calcular-precios:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno al calcular precios.",
    });
  }
});

app.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      ok: false,
      error: `La imagen supera el limite permitido por el backend (${BODY_LIMIT}).`,
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      ok: false,
      error: "El cuerpo de la solicitud no contiene un JSON valido.",
    });
  }

  console.error("Error no controlado en middleware:", error);

  return res.status(500).json({
    ok: false,
    error: "Error interno del servidor.",
  });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
