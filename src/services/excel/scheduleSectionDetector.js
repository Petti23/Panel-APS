import { classifyRow } from './scheduleRowClassifier';
import { normalizeText } from '../../utils/schedule/normalizeText';

export const detectDocumentTitle = (matrix) => {
    for (let i = 0; i < Math.min(5, matrix.length); i++) {
        const row = matrix[i];
        if (!row) continue;
        const potentialTitle = row.find(cell => cell && String(cell).length > 15);
        if (potentialTitle) {
            const text = String(potentialTitle);
            if (text.toLowerCase().includes('programacion') || text.toLowerCase().includes('aps')) {
                return text;
            }
        }
    }
    return '';
};

export const detectHeaderMap = (row) => {
    const map = {};
    row.forEach((cell, idx) => {
        const text = normalizeText(cell);
        if (text.includes('fecha')) map.fecha = idx;
        else if (text.includes('hora')) map.hora = idx;
        else if (text.includes('local')) map.local = idx;
        else if (text === 'vs' || text.includes('vs.')) map.vs = idx;
        else if (text.includes('visit') || text.includes('vistante')) map.visitante = idx; // typo check
        else if (text.includes('diamante')) map.diamante = idx;
        else if (text.includes('arbitro')) map.arbitros = idx;
    });
    return map;
};

export const detectSections = (matrix) => {
    const sections = [];
    let currentSection = null;
    let fallbackHeaderMap = null;
    const documentTitle = detectDocumentTitle(matrix);

    matrix.forEach((row, index) => {
        const classifierResult = classifyRow(row, fallbackHeaderMap, documentTitle);

        if (classifierResult.type === 'category_title') {
            if (currentSection) sections.push(currentSection);
            currentSection = {
                title: classifierResult.value,
                rows: [],
                headerMap: null
            };
        } else if (classifierResult.type === 'header') {
            if (currentSection) {
                currentSection.headerMap = detectHeaderMap(row);
                fallbackHeaderMap = currentSection.headerMap;
            }
        } else if (currentSection) {
            if (classifierResult.type === 'match' || classifierResult.type === 'informative') {
                currentSection.rows.push({ type: classifierResult.type, data: row });
            } else if (classifierResult.type === 'empty' && currentSection.rows.length > 0) {
                // Si encontramos una fila vacia tras haber tenido partidos, podria ser el fin de la seccion
                // Pero en APS a veces hay aire entre partidos. Solo cerramos si detectamos nueva categoria.
            }
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }
    
    return sections;
};
