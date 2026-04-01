import ExcelJS from 'exceljs';

export const readWorkbook = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    return workbook;
};
