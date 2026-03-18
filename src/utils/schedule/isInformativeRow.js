import { normalizeText } from './normalizeText';

export const isInformativeRow = (row) => {
    if (!row || !Array.isArray(row)) return false;
    
    const rowContent = row.map(normalizeText).join(' ');
    
    const informativeKeywords = [
        'sin actividad',
        'torneo organizado por'
    ];
    
    return informativeKeywords.some(kw => rowContent.includes(kw));
};
