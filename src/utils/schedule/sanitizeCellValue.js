export const sanitizeCellValue = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
};
