export const normalizeMergedCells = (matrix, worksheet) => {
    const merges = worksheet['!merges'] || [];
    const normalizedMatrix = matrix.map(row => [...row]); // shallow copy of rows

    merges.forEach(merge => {
        const { s, e } = merge;
        const value = (normalizedMatrix[s.r] && normalizedMatrix[s.r][s.c]) !== undefined 
            ? normalizedMatrix[s.r][s.c] 
            : '';
        
        for (let R = s.r; R <= e.r; ++R) {
            for (let C = s.c; C <= e.c; ++C) {
                if (!normalizedMatrix[R]) normalizedMatrix[R] = [];
                normalizedMatrix[R][C] = value;
            }
        }
    });

    return normalizedMatrix;
};
