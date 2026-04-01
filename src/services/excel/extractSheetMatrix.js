export const extractSheetMatrix = (workbook, sheetIndex = 0) => {
    const worksheet = workbook.worksheets[sheetIndex];
    if (!worksheet) throw new Error("No sheets found in workbook");

    const sheetName = worksheet.name;
    const colCount = worksheet.actualColumnCount || worksheet.columnCount || 0;
    const matrix = [];

    worksheet.eachRow({ includeEmpty: true }, (row) => {
        const rowData = new Array(colCount).fill('');
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[colNumber - 1] = getCellValue(cell);
        });
        matrix.push(rowData);
    });

    return { matrix, worksheet, sheetName };
};

function getCellValue(cell) {
    const v = cell.value;
    if (v === null || v === undefined) return '';
    // Formula cell — return result
    if (typeof v === 'object' && v !== null) {
        if ('result' in v) return v.result ?? '';
        if ('richText' in v) return v.richText.map(rt => rt.text ?? '').join('');
        if (v instanceof Date) return v;
    }
    return v;
}
