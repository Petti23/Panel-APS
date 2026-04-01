import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Faltan variables de entorno de Supabase. ' +
        'Copiá .env.example a .env.local y completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    )
}

// Solo se usa la anon key (clave pública). La service role key NUNCA va en el frontend.
// La seguridad de escritura/lectura la gestionan las Row Level Security (RLS) policies en Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
