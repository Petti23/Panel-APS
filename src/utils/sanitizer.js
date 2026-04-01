/**
 * Sanitizes input text to prevent potential security issues and ensure data integrity.
 * Although we are using Supabase (which handles parameterization), this adds an extra layer
 * of safety as requested by the user.
 */

export const sanitizeInput = (text) => {
    if (typeof text !== 'string') return '';

    // Remove leading/trailing whitespace
    let cleanText = text.trim();

    // Remove potentially dangerous characters for SQL/HTML (basic list)
    // We keep letters, numbers, spaces, dots, dashes, and standard accents/diacritics
    // We specifically strip: ' " ; - (if used as comment) / \ < >

    // For names/DNI, we can be strict.
    // This regex allows alphanumeric, spaces, and common punctuation for names (- . ,)
    // It strips out characters often used in injection attacks like ; ' "
    cleanText = cleanText.replace(/[;'"<>\\]/g, '');

    return cleanText;
}

export const validatePlayerRow = (row) => {
    // Support both Object (with headers) and Array (headless) formats
    // Array format: [Nombre, Apellido, DNI]
    // Object format: { nombre: '...', apellido: '...', dni: '...' }

    let nombre = '';
    let apellido = '';
    let dni = '';

    if (Array.isArray(row)) {
        // Basic heuristics: expect 3 columns. 
        // If row has fewer than 2 items, it's likely invalid or empty
        if (row.length >= 1) nombre = sanitizeInput(String(row[0] || ''));
        if (row.length >= 2) {
            // If only 2 columns, user might have put "Full Name" in col 0. 
            // But adhering to request "Nombre Apellido DNI", we assume Col 1 is Surname.
            apellido = sanitizeInput(String(row[1] || ''));
        }
        if (row.length >= 3) dni = sanitizeInput(String(row[2] || ''));
    } else if (typeof row === 'object' && row !== null) {
        // Normalize keys to lowercase for flexible matching
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        nombre = sanitizeInput(normalizedRow['nombre'] || normalizedRow['name'] || normalizedRow['first name'] || '');
        apellido = sanitizeInput(normalizedRow['apellido'] || normalizedRow['lastname'] || normalizedRow['last name'] || '');
        // Sometimes users put 'dni' or 'documento' or just undefined if it's the 3rd column but headers are missing
        dni = sanitizeInput(String(normalizedRow['dni'] || normalizedRow['documento'] || normalizedRow['document'] || ''));
    }

    const errors = [];

    // Check if row is completely empty
    if (!nombre && !apellido && !dni) {
        return {
            isValid: false,
            isEmpty: true, // Flag to indicate this row should be skipped, not errored
            errors: [],
            data: null
        };
    }

    if (!nombre) errors.push('Falta Nombre');
    // Allow empty surname if user put full name in first column? 
    // For now strict: enforce Surname if possible, but let's see. 
    // Use case "Federico Bregant Botto" -> Col 0: Federico, Col 1: Bregant Botto.
    if (!apellido) errors.push('Falta Apellido');
    if (!dni) errors.push('Falta DNI');

    // Basic format validation
    // Allow spaces, dots in names
    const nameRegex = /^[a-zA-Z\u00C0-\u00FF\s.-]+$/;
    if (nombre && !nameRegex.test(nombre)) errors.push('Nombre contiene caracteres inválidos');
    if (apellido && !nameRegex.test(apellido)) errors.push('Apellido contiene caracteres inválidos');

    // DNI validation (numbers, dots, dashes allowed)
    const dniRegex = /^[0-9.-]+$/;
    if (dni && !dniRegex.test(dni)) errors.push('DNI inválido (solo números, puntos o guiones)');

    return {
        isValid: errors.length === 0,
        isEmpty: false,
        errors,
        data: {
            fullName: `${nombre} ${apellido}`.trim(),
            dni
        }
    };
}
