import axios from 'axios';

// ══════════════════════════════════════════
// URL DE TU SERVIDOR
// ══════════════════════════════════════════
const BASE_URL = 'https://mundo-sin-gluten.onrender.com';

const api = axios.create({
  baseURL: BASE_URL + '/api',
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
});

export async function procesarImagen(base64, mimeType) {
  const r = await api.post('/procesar-imagen-base64', { imagen: base64, mimeType: mimeType || 'image/jpeg' });
  return r.data;
}

export async function procesarCSV(texto) {
  const r = await api.post('/procesar-csv', { texto });
  return r.data;
}

export async function procesarManual(productos) {
  const r = await api.post('/procesar-manual', { productos });
  return r.data;
}

export async function getConfig() {
  const r = await api.get('/config');
  return r.data;
}

export async function saveConfig(config) {
  const r = await api.post('/config', config);
  return r.data;
}

export async function getStats() {
  const r = await api.get('/estadisticas');
  return r.data;
}

export async function checkHealth() {
  const r = await api.get('/health');
  return r.data;
}

export { BASE_URL };
