import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(undefined) // undefined = cargando

    useEffect(() => {
        // Obtener sesión activa al montar
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session ?? null)
        })

        // Escuchar cambios de sesión (login / logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = (email, password) =>
        supabase.auth.signInWithPassword({ email, password })

    const signOut = () => supabase.auth.signOut()

    return (
        <AuthContext.Provider value={{ session, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
