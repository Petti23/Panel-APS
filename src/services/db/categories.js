import { supabase } from '../supabase'

// La nueva DB no tiene tabla de categorías propia.
// Se derivan de los valores únicos del campo category en tournament.
export const fetchCategories = async () => {
    const { data, error } = await supabase
        .from('tournament')
        .select('category')
        .not('category', 'is', null)
        .order('category', { ascending: true })
    if (error) throw error
    const unique = [...new Set(data.map((r) => r.category).filter(Boolean))]
    return unique.map((name) => ({ name }))
}
