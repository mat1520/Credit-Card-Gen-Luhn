// Mostrar notificación
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Crear elemento de tarjeta
export function createCardElement(card) {
    const cardItem = document.createElement('div');
    cardItem.textContent = `${card.number}|${card.month}/${card.year}|${card.cvv}`;
    return cardItem;
}

// Exportar a TXT
export function exportToTXT(cards) {
    const text = cards
        .map(card => `${card.number}|${card.month}/${card.year}|${card.cvv}`)
        .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Exportar a CSV
export function exportToCSV(cards) {
    const text = cards
        .map(card => `${card.number}|${card.month}/${card.year}|${card.cvv}`)
        .join('\n');
    
    const blob = new Blob([text], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
} 