import { normalizeText } from './normalizeText';

export const isHeaderRow = (row) => {
    if (!row || !Array.isArray(row)) return false;
    
    const rowContent = row.map(cell => normalizeText(cell)).join(' ');
    // Mas estricto para evitar que un titulo largo de categoria pase como header
    const requiredKeywords = ['fecha', 'hora', 'local', 'visitante'];
    const hasRequired = requiredKeywords.every(kw => rowContent.includes(kw));
    
    // Un header no suele ser solo una celda larga combinada con todo el texto
    const nonEmptyCells = row.filter(cell => !!String(cell).trim()).length;
    
    return hasRequired && nonEmptyCells >= 4;
};
