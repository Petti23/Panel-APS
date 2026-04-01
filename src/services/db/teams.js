import { supabase } from '../supabase'

const TABLE = 'teams'

export const fetchTeams = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data
}

export const insertTeam = async ({ name, category }) => {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({ name, category })
        .select()
        .single()
    if (error) throw error
    return data
}

export const updateTeam = async (id, { name, category }) => {
    const { data, error } = await supabase
        .from(TABLE)
        .update({ name, category })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export const deleteTeam = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id)
    if (error) throw error
}
