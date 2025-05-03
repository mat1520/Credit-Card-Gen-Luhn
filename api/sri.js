module.exports = async (req, res) => {
  // Solo GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { cedula } = req.query;
  if (!cedula || !/^[0-9]{10}$/.test(cedula)) {
    return res.status(400).json({ error: 'Cédula inválida. Debe tener 10 dígitos.' });
  }

  const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porIdentificacion/${cedula}/?tipoPersona=N&_=${Date.now()}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'No se encontró información para la cédula.' });
      }
      return res.status(response.status).json({ error: 'Error consultando SRI', status: response.status });
    }
    const data = await response.json();
    if (!data || typeof data !== 'object') {
      return res.status(502).json({ error: 'Respuesta inválida del SRI.' });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando SRI', details: err.message });
  }
}; 