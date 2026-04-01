import { isHeaderRow } from '../../utils/schedule/isHeaderRow';
import { isInformativeRow } from '../../utils/schedule/isInformativeRow';
import { isMatchRow } from '../../utils/schedule/isMatchRow';
import { normalizeText } from '../../utils/schedule/normalizeText';

export const classifyRow = (row, headerMap, documentTitle) => {
    if (!row || row.length === 0 || row.every(cell => !cell || !String(cell).trim())) {
        return { type: 'empty' };
    }

    // Si es igual al titulo del documento, ignorar como categoria
    const firstCell = String(row.find(c => !!c) || '').trim();
    if (documentTitle && normalizeText(firstCell) === normalizeText(documentTitle)) {
        return { type: 'document_title' };
    }

    if (isHeaderRow(row)) {
        return { type: 'header' };
    }

    if (isInformativeRow(row)) {
        return { type: 'informative' };
    }

    if (headerMap && isMatchRow(row, headerMap)) {
        // Asegurarnos que no estamos clasificando un titulo de categoria como match
        const catKeywords = ['infantil', 'juvenil', 'primera', 'cadete', 'kdt', 'escuelita', 'lanzamiento'];
        
        // Si la fila tiene casi todo el mismo texto en todas las columnas, es un titulo combinado, no un match
        const uniqueValues = new Set(row.filter(c => !!String(c).trim()).map(c => normalizeText(c)));
        if (uniqueValues.size === 1 && catKeywords.some(kw => Array.from(uniqueValues)[0].includes(kw))) {
             return { type: 'category_title', value: String(row.find(c => !!c)) };
        }
        
        return { type: 'match' };
    }
    
    // Categoría detection: suele ser una fila con una sola celda con texto o texto centrado/repetido por merge
    const nonEmptyCells = row.filter(cell => !!String(cell).trim());
    if (nonEmptyCells.length >= 1) {
        // Obtenemos valores unicos para ver si es un titulo repetido por merge
        const uniqueValues = [...new Set(nonEmptyCells.map(c => normalizeText(c)))];
        
        if (uniqueValues.length <= 2) { // 1 o 2 valores unicos (a veces hay un separador o algo)
            const value = String(nonEmptyCells[0]);
            const normValue = uniqueValues[0];
            const catKeywords = [
                'infantil', 'juvenil', 'primera', 'division', 'cadete', 'kdt', 
                'escuelita', 'lanzamiento', 'femenina', 'torneo', 'u23', 
                'preinfantil', 'lento'
            ];
            
            if (catKeywords.some(kw => normValue.includes(kw))) {
                return { type: 'category_title', value };
            }
        }
    }

    return { type: 'unknown' };
};
