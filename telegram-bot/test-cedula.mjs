import fetch from 'node-fetch';

const cedula = process.argv[2] || '1754198487';
const buildUrl = (c) => `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porIdentificacion/${c}/?tipoPersona=N&_=${Date.now()}`;

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

(async () => {
  try {
    const resp = await fetchWithTimeout(buildUrl(cedula), { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('HTTP STATUS:', resp.status);
    const text = await resp.text();
    try { console.log('BODY JSON:', JSON.parse(text)); }
    catch (e) { console.log('BODY RAW:', text); }
  } catch (err) {
    console.error('Error:', err.message || err);
  }
})();
