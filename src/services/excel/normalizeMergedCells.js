export const normalizeMergedCells = (matrix, worksheet) => {
    // ExcelJS stores merges as strings like "A1:C3" in worksheet.model.merges
    const merges = worksheet.model?.merges || [];
    const normalizedMatrix = matrix.map(row => [...row]);

    merges.forEach(mergeRange => {
        const match = mergeRange.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/i);
        if (!match) return;

        const startRow = parseInt(match[2], 10) - 1; // to 0-based
        const endRow   = parseInt(match[4], 10) - 1;
        const startCol = colLettersToIndex(match[1]);
        const endCol   = colLettersToIndex(match[3]);

        const value = normalizedMatrix[startRow]?.[startCol] ?? '';

        for (let R = startRow; R <= endRow; ++R) {
            for (let C = startCol; C <= endCol; ++C) {
                if (!normalizedMatrix[R]) normalizedMatrix[R] = [];
                normalizedMatrix[R][C] = value;
            }
        }
    });

    return normalizedMatrix;
};

function colLettersToIndex(letters) {
    let index = 0;
    const upper = letters.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
        index = index * 26 + upper.charCodeAt(i) - 64;
    }
    return index - 1; // 0-based
}
