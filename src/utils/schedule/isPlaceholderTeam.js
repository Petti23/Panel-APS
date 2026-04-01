/**
 * Detecta si un nombre de "equipo" es en realidad un placeholder de llave/torneo,
 * por ejemplo: "GP1", "GP2", "1°", "2°", "3°", "4°", "GANADOR A", "PERDEDOR B", etc.
 * Estos no deben insertarse como equipos reales en la BD.
 */
const PLACEHOLDER_PATTERNS = [
    /^GP\d+$/i,                            // GP1, GP2, GP3...
    /^\d+[°º]$/,                           // 1°, 2°, 3°, 4°, 1º, 2º...
    /^(GANADOR|PERDEDOR|WINNER|LOSER)\b/i, // GANADOR GRUPO A, PERDEDOR SERIE B...
    /^CLASIFICADO\b/i,                     // CLASIFICADO 1...
    /^(POS|PUESTO)\s*\d+/i,               // POS 1, PUESTO 2...
];

export const isPlaceholderTeam = (name) => {
    if (!name) return false;
    const trimmed = String(name).trim();
    return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
};
