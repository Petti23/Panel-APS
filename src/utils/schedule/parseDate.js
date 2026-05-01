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

export const parseDateToISO = (dateInput) => {
    if (!dateInput) return '';
    
    // Si ya es un string ISO o similar, intentamos parsear directamente
    const dateStr = String(dateInput);

    // Caso 1: DD/MM/YYYY o DD-MM-YYYY
    const dmyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    }

    // Caso 2: YYYY-MM-DD (ISO)
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return isoMatch[0];

    // Caso 3: Formato texto "9 de marzo 2026"
    const normalized = normalizeText(dateStr);
    const dayMatch = normalized.match(/\b(\d{1,2})\b/);
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    
    let month = null;
    for (const [name, value] of Object.entries(monthMap)) {
        if (normalized.includes(name)) {
            month = value;
            break;
        }
    }

    if (dayMatch && month && yearMatch) {
        return `${yearMatch[1]}-${month}-${dayMatch[1].padStart(2, '0')}`;
    }

    // Caso 4: Intento desesperado con new Date()
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
            return d.toISOString().split('T')[0];
        }
    } catch (e) {}

    return '';
};

export const parseTimeToHHMM = (timeInput) => {
    if (!timeInput) return '00:00';
    const timeStr = String(timeInput);

    // Caso 1: Buscar HH:MM dentro de cualquier string (incluso si es un Date string largo)
    // Buscamos el patrón HH:MM:SS o HH:MM
    const hmMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (hmMatch) {
        // OJO: Si el string es algo como "2026-05-07...", el match podría ser parte de la fecha.
        // Pero en los strings de Date de JS, la hora suele venir después del año/mes/día.
        return `${hmMatch[1].padStart(2, '0')}:${hmMatch[2]}`;
    }

    // Caso 2: Si es un objeto Date (Excel time suele venir como 1899-12-30T...)
    try {
        const d = new Date(timeInput);
        if (!isNaN(d.getTime())) {
            // Si el año es menor a 1905, es casi seguro un tiempo de Excel (base 1899/1900).
            // Usamos los métodos UTC para obtener la hora "nominal" que puso el usuario.
            if (d.getFullYear() < 1905) {
                const h = d.getUTCHours().toString().padStart(2, '0');
                const m = d.getUTCMinutes().toString().padStart(2, '0');
                return `${h}:${m}`;
            }
            const h = d.getHours().toString().padStart(2, '0');
            const m = d.getMinutes().toString().padStart(2, '0');
            return `${h}:${m}`;
        }
    } catch (e) {}

    return '00:00';
};
