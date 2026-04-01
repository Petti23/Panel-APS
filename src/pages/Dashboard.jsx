import { useData } from '../context/DataContext'
import { Trophy, Calendar, Shield, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../components/Pages.css'

const Dashboard = () => {
    const { tournaments, games, teams, players } = useData()

    const stats = [
        { label: 'Torneos',   value: tournaments.length, icon: Trophy,   color: 'var(--primary)', bg: 'rgba(26,54,93,0.1)',   path: '/tournaments' },
        { label: 'Partidos',  value: games.length,       icon: Calendar, color: 'var(--accent)',  bg: 'rgba(39,98,33,0.1)',   path: '/games' },
        { label: 'Equipos',   value: teams.length,       icon: Shield,   color: 'var(--clay)',   bg: 'rgba(184,50,50,0.1)',  path: '/teams' },
        { label: 'Jugadores', value: players.length,     icon: Users,    color: '#7c3aed',       bg: 'rgba(124,58,237,0.1)', path: '/players' },
    ]

    const recentGames = games.slice(-5).reverse()
    const getTournamentName = (id) => tournaments.find(t => t.id == id)?.name || 'Desconocido'
    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Desconocido'

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div className="page-title-group">
                    <h1>Panel de Control</h1>
                    <p>Bienvenido al sistema de gestión de la APS Liga</p>
                </div>
            </div>

            <div className="stat-grid">
                {stats.map((stat) => (
                    <Link key={stat.label} to={stat.path} className="stat-card">
                        <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p className="stat-label">{stat.label}</p>
                            <p className="stat-value">{stat.value}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="dashboard-grid">
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>Actividad Reciente</h3>
                        <Link to="/games" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {recentGames.length === 0 ? (
                            <div className="empty-state" style={{ border: 'none', padding: '3rem' }}>
                                <div className="empty-state-icon"><Calendar size={22} /></div>
                                <h3>Sin partidos registrados</h3>
                                <p>Importá un Excel o agregá partidos manualmente.</p>
                            </div>
                        ) : (
                            <div className="recent-games-list">
                                {recentGames.map((g) => (
                                    <div key={g.id} className="match-row">
                                        <p className="match-team-home">{getTeamName(g.homeTeamId)}</p>
                                        <div className="match-vs-badge">VS</div>
                                        <p className="match-team-away">{getTeamName(g.visitorTeamId)}</p>
                                        <div className="match-meta">
                                            <p className="match-meta-tournament">{getTournamentName(g.tournamentId)}</p>
                                            <p className="match-meta-date">{g.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <aside>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Accesos Rápidos</h3>
                    <div className="quick-actions">
                        <Link to="/games" className="btn btn-primary" style={{ width: '100%' }}>Ver Programación</Link>
                        <Link to="/tournaments" className="btn btn-outline" style={{ width: '100%' }}>Gestionar Torneos</Link>
                        <Link to="/teams" className="btn btn-outline" style={{ width: '100%' }}>Gestionar Equipos</Link>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Dashboard
