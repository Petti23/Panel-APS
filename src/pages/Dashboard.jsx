import { useData } from '../context/DataContext'
import '../components/Table.css' // reusing card styles

const Dashboard = () => {
    const { tournaments, games, teams, players } = useData()

    // Calculate stats
    const totalTournaments = tournaments.length
    const totalGames = games.length
    const totalTeams = teams.length
    const totalPlayers = players.length

    // Recent activity (dummy for now, or derived from data if we had creation dates)
    const recentGames = games.slice(-3).reverse() // Show last 3 added games

    const getTournamentName = (id) => tournaments.find(t => t.id == id)?.name || 'Desconocido'
    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Desconocido'

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card animate-fade-in" style={{ animationDelay: '0ms' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Torneos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalTournaments}</p>
                </div>
                <div className="card animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Partidos Programados</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalGames}</p>
                </div>
                <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Equipos Activos</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalTeams}</p>
                </div>
                <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Jugadores</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalPlayers}</p>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Partidos Recientes</h3>
                <div className="card">
                    {recentGames.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay partidos recientes.</p>
                    ) : (
                        <ul style={{ listStyle: 'none' }}>
                            {recentGames.map(g => (
                                <li key={g.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{getTeamName(g.homeTeamId)}</span>
                                        <span style={{ margin: '0 0.5rem', color: 'var(--text-secondary)' }}>vs</span>
                                        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{getTeamName(g.visitorTeamId)}</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {getTournamentName(g.tournamentId)} - {g.date}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
