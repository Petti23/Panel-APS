import { sanitizeCellValue } from './sanitizeCellValue';

export const isMatchRow = (row, headerMap) => {
    if (!row || row.length === 0 || !headerMap) return false;

    const fechaVal = sanitizeCellValue(row[headerMap.fecha]);
    const horaVal = sanitizeCellValue(row[headerMap.hora]);
    const localVal = sanitizeCellValue(row[headerMap.local]);
    const visitanteVal = sanitizeCellValue(row[headerMap.visitante]);

    // Un partido debe tener al menos local y visitante siempre
    if (!localVal || !visitanteVal) return false;

    // La fecha en APS suele ser "Lunes, 9 de marzo..." o similar. 
    // Comprobamos si tiene al menos un numero o nombre de mes/dia
    const hasFecha = fechaVal.length > 3;
    
    // La hora suele ser "HH:MM"
    const hasHora = /\d{1,2}:\d{2}/.test(horaVal);

    return (hasFecha || hasHora) && localVal.length > 1 && visitanteVal.length > 1;
};
