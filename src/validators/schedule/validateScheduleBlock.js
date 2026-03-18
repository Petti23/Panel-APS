export const validateScheduleBlock = (block) => {
    const errors = [];
    const warnings = [];

    if (!block.categoriaRaw) {
        errors.push("El bloque no tiene categoría detectada");
    }

    if (block.estado === 'con_partidos' && (!block.partidos || block.partidos.length === 0)) {
        warnings.push("Bloque marcado con partidos pero lista vacía");
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};
