import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import Games from './pages/Games'
import Teams from './pages/Teams'
import Players from './pages/Players'

function App() {
    return (
        <DataProvider>
            <BrowserRouter>
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
            </BrowserRouter>
        </DataProvider>
    )
}

export default App
