import { supabase } from '../supabase'

const TABLE = 'tournaments'

export const fetchTournaments = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data
}

export const insertTournament = async ({ name, category }) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({ name, category })
        .select()
        .single()
    if (error) throw error
    return data
}

export const updateTournament = async (id, { name, category }) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update({ name, category })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export const deleteTournament = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
    if (error) throw error
}
