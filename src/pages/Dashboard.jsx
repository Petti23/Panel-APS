import { useData } from '../context/DataContext'
import { Trophy, Calendar, Shield, Users, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
    const { tournaments, games, teams, players } = useData()

    const stats = [
        { label: 'Torneos', value: tournaments.length, icon: Trophy, color: 'var(--primary)', path: '/tournaments' },
        { label: 'Partidos', value: games.length, icon: Calendar, color: 'var(--accent)', path: '/games' },
        { label: 'Equipos', value: teams.length, icon: Shield, color: 'var(--clay)', path: '/teams' },
        { label: 'Jugadores', value: players.length, icon: Users, color: '#6366f1', path: '/players' },
    ]

    const recentGames = games.slice(-4).reverse()

    const getTournamentName = (id) => tournaments.find(t => t.id == id)?.name || 'Desconocido'
    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Desconocido'

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Panel de Control</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Bienvenido al sistema de gestión de la APS Liga</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {stats.map((stat, i) => (
                    <Link key={stat.label} to={stat.path} className="card" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.5rem',
                        animationDelay: `${i * 100}ms`,
                        textDecoration: 'none'
                    }}>
                        <div style={{ 
                            width: '3.5rem', 
                            height: '3.5rem', 
                            borderRadius: 'var(--radius-sm)', 
                            backgroundColor: `${stat.color}15`, 
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stat.value}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>Actividad Reciente</h3>
                        <Link to="/games" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {recentGames.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay partidos registrados aún.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {recentGames.map((g, i) => (
                                    <div key={g.id} style={{ 
                                        padding: '1.25rem 1.5rem', 
                                        borderBottom: i === recentGames.length - 1 ? 'none' : '1px solid var(--border-light)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background-color 0.2s'
                                    }} className="hover:bg-slate-50">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '60%' }}>
                                            <div style={{ textAlign: 'right', flex: 1, fontWeight: 700 }}>{getTeamName(g.homeTeamId)}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>VS</div>
                                            <div style={{ textAlign: 'left', flex: 1, fontWeight: 700 }}>{getTeamName(g.visitorTeamId)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{getTournamentName(g.tournamentId)}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <aside>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Accesos Rápidos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="btn btn-primary" style={{ width: '100%' }}>Generar Reporte</button>
                        <button className="btn btn-outline" style={{ width: '100%' }}>Configuración</button>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Dashboard
