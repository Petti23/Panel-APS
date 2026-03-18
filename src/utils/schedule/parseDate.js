import { normalizeText } from './normalizeText';

const monthMap = {
    'enero': '01',
    'febrero': '02',
    'marzo': '03',
    'abril': '04',
    'mayo': '05',
    'junio': '06',
    'julio': '07',
    'agosto': '08',
    'septiembre': '09',
    'setiembre': '09',
    'octubre': '10',
    'noviembre': '11',
    'diciembre': '12'
};

export const parseDateToISO = (dateStr) => {
    if (!dateStr) return '';
    
    // Format expected: "Lunes, 9 de marzo de 2026" or "9 de marzo 2026"
    const normalized = normalizeText(dateStr);
    
    // Extract day, month, and year using regex
    const dayMatch = normalized.match(/\b(\d{1,2})\b/);
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    
    let month = '01';
    for (const [name, value] of Object.entries(monthMap)) {
        if (normalized.includes(name)) {
            month = value;
            break;
        }
    }

    const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

    return `${year}-${month}-${day}`;
};
