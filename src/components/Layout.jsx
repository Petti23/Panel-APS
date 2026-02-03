import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Trophy, Calendar, Users, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const location = useLocation()

    const navItems = [
        { path: '/', label: 'Inicio', icon: LayoutDashboard },
        { path: '/tournaments', label: 'Torneos', icon: Trophy },
        { path: '/games', label: 'Partidos', icon: Calendar },
        { path: '/teams', label: 'Equipos', icon: Shield },
        { path: '/players', label: 'Jugadores', icon: Users },
    ]

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

    const currentTitle = navItems.find(item => item.path === location.pathname)?.label || 'APS Liga'

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1 className="brand">APS Liga</h1>
                    <p className="brand-subtitle">Admin Panel</p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <div className="user-info">
                            <p>Admin User</p>
                            <p>admin@apsliga.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="main-content">
                <header className="mobile-header">
                    <h1 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{currentTitle}</h1>
                    <button onClick={toggleMobileMenu} className="mobile-menu-btn">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>

                {isMobileMenuOpen && (
                    <div className="mobile-menu-overlay open">
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                )}

                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
