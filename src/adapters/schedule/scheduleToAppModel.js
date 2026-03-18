export const scheduleToAppModel = (parsedData) => {
    return {
        titulo: parsedData.tituloGeneral,
        categorias: parsedData.categorias.map(c => ({
            categoria: c.categoria,
            torneo: c.torneo,
            anio: c.anio,
            estado: c.estado,
            mensaje: c.mensaje,
            partidos: c.partidos.map(p => ({
                fechaTexto: p.fechaTexto,
                hora: p.hora,
                local: p.local,
                vs: p.vs,
                visitante: p.visitante,
                diamante: p.diamante,
                arbitros: p.arbitros,
                tipo: p.tipo
            }))
        }))
    };
};
