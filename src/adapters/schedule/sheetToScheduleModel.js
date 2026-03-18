import { extractSheetMatrix } from '../../services/excel/extractSheetMatrix';
import { normalizeMergedCells } from '../../services/excel/normalizeMergedCells';
import { detectDocumentTitle, detectSections } from '../../services/excel/scheduleSectionDetector';
import { parseSection } from '../../services/excel/scheduleParser';

export const sheetToScheduleModel = (workbook) => {
    const { matrix, worksheet } = extractSheetMatrix(workbook, 0);
    const normalized = normalizeMergedCells(matrix, worksheet);

    const tituloGeneral = detectDocumentTitle(normalized);
    const sections = detectSections(normalized);

    const categorias = [];
    const estadisticas = {
        categoriasDetectadas: 0,
        partidosValidos: 0,
        bloquesSinActividad: 0,
        advertencias: 0,
        errores: 0
    };

    sections.forEach(section => {
        const result = parseSection(section);
        categorias.push(result.block);
        
        estadisticas.categoriasDetectadas++;
        estadisticas.partidosValidos += result.block.partidos.length;
        if (result.block.estado === 'sin_actividad') {
            estadisticas.bloquesSinActividad++;
        }
        
        if (!result.isValid) estadisticas.errores++;
        if (result.warnings.length > 0) estadisticas.advertencias += result.warnings.length;
        if (result.block.erroresFila.length > 0) estadisticas.advertencias += result.block.erroresFila.length;
    });

    return {
        tituloGeneral,
        categorias,
        estadisticas
    };
};
