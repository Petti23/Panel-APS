import { parseCategoryTitle } from '../../utils/schedule/parseCategoryTitle';
import { validateMatchRow } from '../../validators/schedule/validateMatchRow';
import { validateScheduleBlock } from '../../validators/schedule/validateScheduleBlock';
import { sanitizeCellValue } from '../../utils/schedule/sanitizeCellValue';

export const parseSection = (section) => {
    const parsed = parseCategoryTitle(section.title);
    
    const block = {
        categoriaRaw: parsed.categoriaRaw,
        categoria: parsed.categoria,
        torneo: parsed.torneo,
        anio: parsed.anio,
        estado: 'con_partidos', 
        partidos: [],
        mensaje: '',
        erroresFila: []
    };

    section.rows.forEach((rowInfo, idx) => {
        if (rowInfo.type === 'informative') {
            const msg = rowInfo.data.map(c => sanitizeCellValue(c)).filter(Boolean).join(' ');
            const lowerMsg = msg.toLowerCase();
            
            if (lowerMsg.includes('sin actividad')) {
                block.estado = 'sin_actividad';
                block.mensaje = msg;
            } else if (lowerMsg.includes('torne') || lowerMsg.includes('organiz')) {
                // Es informativo pero puede convivir con partidos o ser el unico dato
                if (block.partidos.length === 0) {
                    block.estado = 'informativo';
                }
                block.mensaje = (block.mensaje ? block.mensaje + ' | ' : '') + msg;
            }
        } else if (rowInfo.type === 'match' && block.estado !== 'sin_actividad') {
            if (!section.headerMap) return; // No podemos parsear sin cabeceras
            
            const validationResult = validateMatchRow(rowInfo.data, section.headerMap);
            if (validationResult.isValid) {
                block.partidos.push(validationResult.data);
                // Si encontramos partidos, el estado debe ser 'con_partidos' aunque hubiera msg informativo
                block.estado = 'con_partidos';
            } else {
                // Si fallan campos criticos, podria no ser un partido real sino basura o titulo
                // Solo logueamos si parece un intento real de partido (tiene algo en fecha)
                if (rowInfo.data[section.headerMap.fecha]) {
                    block.erroresFila.push({ rowData: rowInfo.data, errors: validationResult.errors });
                }
            }
        }
    });

    const blockValidation = validateScheduleBlock(block);
    return {
        block,
        isValid: blockValidation.isValid,
        errors: blockValidation.errors,
        warnings: blockValidation.warnings
    };
};
