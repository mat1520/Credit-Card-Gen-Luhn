document.getElementById('sriForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cedula = document.getElementById('cedula').value;
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    try {
        const response = await fetch(`https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porIdentificacion/${cedula}/?tipoPersona=N&_=${Date.now()}`);
        const data = await response.json();
        
        if (data.contribuyente) {
            let html = `
                <div class="result-item">
                    <p><strong>Identificación:</strong> ${data.contribuyente.identificacion || 'No disponible'}</p>
                    <p><strong>Nombre Comercial:</strong> ${data.contribuyente.nombreComercial || 'No disponible'}</p>
                    <p><strong>Clase:</strong> ${data.contribuyente.clase || 'No disponible'}</p>
                    <p><strong>Tipo de Identificación:</strong> ${data.contribuyente.tipoIdentificacion || 'No disponible'}</p>
                </div>
            `;
            
            if (data.deuda) {
                html += `
                    <div class="result-item">
                        <h3>Información de Deuda</h3>
                        <p><strong>Estado:</strong> ${data.deuda.estado || 'No disponible'}</p>
                        <p><strong>Monto:</strong> ${data.deuda.monto || 'No disponible'}</p>
                    </div>
                `;
            }
            
            resultContent.innerHTML = html;
        } else {
            resultContent.innerHTML = '<p class="error">No se encontró información para la cédula proporcionada.</p>';
        }
        
        resultDiv.style.display = 'block';
    } catch (error) {
        resultContent.innerHTML = '<p class="error">Error al realizar la consulta. Por favor, intente nuevamente.</p>';
        resultDiv.style.display = 'block';
        console.error('Error:', error);
    }
}); 