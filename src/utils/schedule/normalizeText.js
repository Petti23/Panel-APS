export const normalizeText = (text) => {
    if (text === null || text === undefined) return '';
    return String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // collapse extra spaces
};
