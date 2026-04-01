import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import Games from './pages/Games'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Login from './pages/Login'

const ProtectedRoutes = () => {
    const { session } = useAuth()

    // Mientras se verifica la sesión, no renderizar nada
    if (session === undefined) return null

    // Sin sesión → mostrar login
    if (!session) return <Login />

    return (
        <DataProvider>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="tournaments" element={<Tournaments />} />
                    <Route path="games" element={<Games />} />
                    <Route path="teams" element={<Teams />} />
                    <Route path="players" element={<Players />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </DataProvider>
    )
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <ProtectedRoutes />
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
