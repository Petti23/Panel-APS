export const parseMatchType = (vsValue) => {
    if (!String(vsValue).trim()) return 'partido_regular';
    const normalized = String(vsValue).trim().toUpperCase();
    if (/^P\d+$/.test(normalized)) {
        return 'playoff';
    }
    return 'partido_regular';
};
