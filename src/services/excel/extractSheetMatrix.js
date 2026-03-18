import * as XLSX from 'xlsx';

export const extractSheetMatrix = (workbook, sheetIndex = 0) => {
    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) throw new Error("No sheets found in workbook");
    const worksheet = workbook.Sheets[sheetName];
    // header: 1 gives us raw array of arrays
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    return { matrix, worksheet, sheetName };
};
