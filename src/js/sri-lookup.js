document.getElementById('sriForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cedula = document.getElementById('cedula').value;
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    try {
        console.log('Iniciando consulta SRI para cédula:', cedula);
        const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porIdentificacion/${cedula}/?tipoPersona=N&_=${Date.now()}`;
        console.log('URL de la consulta:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin,
                'Referer': window.location.origin
            },
            mode: 'cors',
            credentials: 'omit'
        });
        
        console.log('Estado de la respuesta:', response.status);
        console.log('Headers de la respuesta:', response.headers);
        
        if (!response.ok) {
            if (response.status === 0) {
                throw new Error('Error de CORS: No se puede acceder al recurso. Por favor, intente más tarde.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
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
        console.error('Error detallado:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'No se pudo conectar con el servidor del SRI. Por favor, intente más tarde.';
        }
        resultContent.innerHTML = `
            <p class="error">Error al realizar la consulta:</p>
            <p class="error-details">${errorMessage}</p>
            <p class="error-help">Por favor, intente nuevamente o contacte al soporte.</p>
        `;
        resultDiv.style.display = 'block';
    }
}); 