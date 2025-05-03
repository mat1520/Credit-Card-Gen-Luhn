document.getElementById('sriForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cedula = document.getElementById('cedula').value;
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('resultContent');
    
    try {
        console.log('Iniciando consulta de nombres para cédula:', cedula);
        // Consulta al nuevo endpoint serverless
        const url = `/api/cedula?cedula=${cedula}`;
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
        
        if (data.nombres) {
            resultContent.innerHTML = `<div class="result-item"><p><strong>Nombres:</strong> ${data.nombres}</p></div>`;
        } else {
            resultContent.innerHTML = '<p class="error">No se encontró información de nombres para la cédula proporcionada.</p>';
        }
        
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('Error detallado:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'No se pudo conectar con el servidor. Por favor, intente más tarde.';
        }
        resultContent.innerHTML = `
            <p class="error">Error al realizar la consulta:</p>
            <p class="error-details">${errorMessage}</p>
            <p class="error-help">Por favor, intente nuevamente o contacte al soporte.</p>
        `;
        resultDiv.style.display = 'block';
    }
}); 