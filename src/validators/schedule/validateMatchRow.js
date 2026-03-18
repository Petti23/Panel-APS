import { sanitizeCellValue } from '../../utils/schedule/sanitizeCellValue';
import { parseMatchType } from '../../utils/schedule/parseMatchType';

export const validateMatchRow = (row, headerMap) => {
    const defaultRes = { isValid: false, errors: [], data: null };
    
    if (!row || !headerMap) {
        defaultRes.errors.push("Invalid row or headers missing");
        return defaultRes;
    }

    const fechaTexto = sanitizeCellValue(row[headerMap.fecha]);
    const hora = sanitizeCellValue(row[headerMap.hora]);
    const local = sanitizeCellValue(row[headerMap.local]);
    const visitante = sanitizeCellValue(row[headerMap.visitante]);
    const vsRaw = headerMap.vs !== undefined ? sanitizeCellValue(row[headerMap.vs]) : '';
    const diamante = headerMap.diamante !== undefined ? sanitizeCellValue(row[headerMap.diamante]) : '';
    const arbitros = headerMap.arbitros !== undefined ? sanitizeCellValue(row[headerMap.arbitros]) : '';

    const errors = [];
    if (!fechaTexto) errors.push("Fecha requerida");
    if (!hora) errors.push("Hora requerida");
    if (!local) errors.push("Local requerido");
    if (!visitante) errors.push("Visitante requerido");

    if (errors.length > 0) {
        return { isValid: false, errors, data: null };
    }

    const tipo = parseMatchType(vsRaw);

    return {
        isValid: true,
        errors: [],
        data: {
            fechaTexto,
            hora,
            local,
            vs: vsRaw,
            visitante,
            diamante,
            arbitros,
            tipo
        }
    };
};
