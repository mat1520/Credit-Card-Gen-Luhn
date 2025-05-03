module.exports = async (req, res) => {
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
    const data = await response.json();
    if (data && data.contribuyente && data.contribuyente.nombreComercial) {
      return res.status(200).json({ nombres: data.contribuyente.nombreComercial });
    } else {
      return res.status(404).json({ error: 'No se encontró información para la cédula proporcionada.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error al consultar la cédula', details: error.message });
  }
}; 