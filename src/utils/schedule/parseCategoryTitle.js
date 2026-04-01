export const parseCategoryTitle = (rawTitle) => {
    const yearMatch = rawTitle.match(/\b(20\d{2})\b/);
    const anio = yearMatch ? yearMatch[1] : null;

    const torneoMatch = rawTitle.match(/(\d+°\s*TORNEO)/i);
    const torneo = torneoMatch ? torneoMatch[1].toUpperCase() : null;

    let categoria = rawTitle;
    if (anio) categoria = categoria.replace(anio, '');
    if (torneo) categoria = categoria.replace(new RegExp(torneo, 'i'), '');
    
    categoria = categoria.replace(/[-|]/g, '').trim();

    return {
        categoriaRaw: rawTitle,
        categoria: categoria || rawTitle,
        torneo,
        anio
    };
};
