import { supabase } from '../supabase'

const TABLE = 'categories'

export const fetchCategories = async () => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('name, sort_order')
        .order('sort_order', { ascending: true })
    if (error) throw error
    return data
}
