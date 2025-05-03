document.getElementById('sriForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cedula = document.getElementById('cedula').value;
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    try {
        console.log('Iniciando consulta SRI para cédula:', cedula);
        // Usar el proxy serverless en Vercel
        const url = `/api/sri?cedula=${cedula}`;
        console.log('URL de la consulta:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.error) {
            resultContent.innerHTML = `<p class="error">${data.error}</p>`;
            resultDiv.style.display = 'block';
            return;
        }
        
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