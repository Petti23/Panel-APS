import { normalizeText } from './normalizeText'
import { parseDateToISO, parseTimeToHHMM } from './parseDate'

/**
 * Parsea un array de filas de Excel con el formato:
 * Fecha, Hora, Cancha, Equipo1, Equipo2
 */
export const parseSimpleSchedule = (rows) => {
    // Saltamos cabeceras si existen (buscamos la primera fila con fecha válida)
    return rows.map(row => {
        // Asumimos que row es un array o un objeto
        const values = Array.isArray(row) ? row : Object.values(row)
        
        if (values.length < 5) return null
        
        const [fecha, hora, cancha, equipo1, equipo2] = values
        
        const isoDate = parseDateToISO(fecha)
        if (!isoDate) return null
        
        return {
            date: isoDate,
            time: parseTimeToHHMM(hora),
            field: cancha || '',
            homeTeam: equipo1,
            awayTeam: equipo2
        }
    }).filter(Boolean)
}
