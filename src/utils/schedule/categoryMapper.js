import { normalizeText } from './normalizeText.js';

/**
 * Pre-procesa el texto crudo antes de buscar la categoría:
 *  - Convierte comillas tipográficas (curvas del Excel) a comillas rectas
 *  - Elimina el año (ej. "2026") para que no interfiera con el mapeo
 */
const preprocess = (text) => {
    return String(text)
        .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"') // " " « » → "
        .replace(/[\u2018\u2019]/g, "'")              // ' ' → '
        .replace(/\b20\d{2}\b/g, '')                 // strip año (2020-2099)
        .replace(/\s+/g, ' ')
        .trim();
};

const CATEGORY_MAPPINGS = [
    { keywords: ['escuelita'], official: 'Escuelita' },
    { keywords: ['preinfantil'], official: 'Preinfantil' },
    { keywords: ['infantil'], official: 'Infantil' },
    { keywords: ['cadete', 'kdt'], official: 'Cadete' },
    { keywords: ['juveniles', 'juvenil'], official: 'Juveniles' },
    { keywords: ['u23'], official: 'U23' },
    { keywords: ['primera division', 'primera a'], official: 'Primera Division (Primera A)' },
    { keywords: ['primera b'], official: 'Primera "B"' },
    { keywords: ['femenino', 'femenina', 'liga femenina'], official: 'Primera Femenino' },
    { keywords: ['lanzamiento lento +35 femenino'], official: 'Lanzamiento Lento +35 Femenino' },
    { keywords: ['lanzamiento lento +35'], official: 'Lanzamiento Lento +35' },
    { keywords: ['lanzamiento lento +48'], official: 'Lanzamiento Lento +48' }
];

/**
 * Maps a raw string from Excel to an official category and extracts tournament name.
 * Example: "KDT "A" 1° Torneo 2026"
 * Returns: { category: "Cadete", tournamentName: "1° Torneo 2026" }
 */
export const mapCategoryAndTournament = (rawText) => {
    if (!rawText) return { category: 'Desconocido', tournamentName: '' };

    const cleaned = preprocess(rawText);       // sin año, sin comillas curvas
    const normalized = normalizeText(cleaned); // sin tildes, minúsculas
    
    // Sort mappings by keyword length descending to match more specific phrases first
    // (e.g., "lanzamiento lento +35 femenino" before "lanzamiento lento +35")
    const sortedMappings = [...CATEGORY_MAPPINGS].sort((a, b) => {
        const maxA = Math.max(...a.keywords.map(k => k.length));
        const maxB = Math.max(...b.keywords.map(k => k.length));
        return maxB - maxA;
    });

    for (const mapping of sortedMappings) {
        for (const keyword of mapping.keywords) {
            const normKeyword = normalizeText(keyword);
            if (normalized.includes(normKeyword)) {
                // Find where the keyword starts in the normalized text
                const keywordIdx = normalized.indexOf(normKeyword);
                
                // We want to slice from the end of the keyword to get the tournament name
                // To be safe with "KDT A", we check if the next word is "A"
                let sliceIdx = keywordIdx + keyword.length;
                
                // Special case for KDT "A" or KDT A
                if (mapping.official === 'Cadete' && (normalized.includes('kdt a') || normalized.includes('kdt "a"'))) {
                    const aIdx = normalized.indexOf(' a', keywordIdx);
                    if (aIdx !== -1) sliceIdx = aIdx + 2;
                    const aQuotesIdx = normalized.indexOf(' "a"', keywordIdx);
                    if (aQuotesIdx !== -1) sliceIdx = aQuotesIdx + 4;
                }

                let remainingText = cleaned.substring(sliceIdx).trim();
                
                // Remove leading quotes or dashes that might remain
                remainingText = remainingText.replace(/^["'\-\s]+/, '').trim();
                
                return {
                    category: mapping.official,
                    tournamentName: remainingText || 'Torneo General'
                };
            }
        }
    }

    return {
        category: 'Desconocido',
        tournamentName: rawText
    };
};
