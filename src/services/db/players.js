import { supabase } from '../supabase'

const TABLE = 'player'

// Mapeo snake_case (DB) ↔ camelCase (app)
const fromRow = (row) => ({
    id: row.player_id,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    firstName: row.first_name,
    lastName: row.last_name,
    // 'dni' se mantiene como alias de national_id para compatibilidad con la UI
    dni: row.national_id,
    nationalId: row.national_id,
    birthDate: row.birth_date,
    batHand: row.bat_hand,
    throwHand: row.throw_hand,
})

const toRow = ({ fullName, firstName, lastName, nationalId, dni, birthDate, batHand, throwHand }) => {
    // Soporta nombre completo o separado
    let first = firstName
    let last = lastName
    if ((!first || !last) && fullName) {
        const parts = fullName.trim().split(' ')
        first = first || parts[0]
        last = last || parts.slice(1).join(' ') || parts[0]
    }
    return {
        first_name: first || '',
        last_name: last || '',
        national_id: nationalId || dni || null,
        birth_date: birthDate || null,
        bat_hand: batHand || 'R',
        throw_hand: throwHand || 'R',
    }
}

export const fetchPlayers = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(fromRow)
}

export const insertPlayer = async (player) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert(toRow(player))
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const updatePlayer = async (id, player) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update(toRow(player))
        .eq('player_id', id)
        .select()
        .single()
    if (error) throw error
    return fromRow(data)
}

export const deletePlayer = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('player_id', id)
    if (error) throw error
}
