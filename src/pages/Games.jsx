import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import '../components/Table.css'

const Games = () => {
    const { games, tournaments, teams, addGame, updateGame, deleteGame } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentGame, setCurrentGame] = useState(null)

    const [formData, setFormData] = useState({
        tournamentId: '',
        homeTeamId: '',
        visitorTeamId: '',
        field: '',
        date: '',
        time: ''
    })

    // Derived state for the form
    const selectedTournament = tournaments.find(t => t.id == formData.tournamentId)
    const availableTeams = selectedTournament
        ? teams.filter(t => t.category === selectedTournament.category)
        : []

    const handleOpenModal = (game = null) => {
        if (game) {
            setCurrentGame(game)
            setFormData({
                tournamentId: game.tournamentId,
                homeTeamId: game.homeTeamId,
                visitorTeamId: game.visitorTeamId,
                field: game.field,
                date: game.date,
                time: game.time
            })
        } else {
            setCurrentGame(null)
            // Reset form
            setFormData({
                tournamentId: '',
                homeTeamId: '',
                visitorTeamId: '',
                field: '',
                date: '',
                time: ''
            })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentGame(null)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentGame) {
            updateGame(currentGame.id, formData)
        } else {
            addGame(formData)
        }
        handleCloseModal()
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este partido?')) {
            deleteGame(id)
        }
    }

    const getTournamentName = (id) => tournaments.find(t => t.id == id)?.name || 'Desconocido'
    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Desconocido'
    const getTournamentCategory = (id) => tournaments.find(t => t.id == id)?.category || ''

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Partidos</h2>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus size={20} />
                    Nuevo Partido
                </button>
            </div>

            <div className="card table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Torneo / Categoría</th>
                            <th>Encuentro</th>
                            <th>Cancha</th>
                            <th>Fecha y Hora</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {games.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No hay partidos programados
                                </td>
                            </tr>
                        ) : (
                            games.map((g) => (
                                <tr key={g.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{getTournamentName(g.tournamentId)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getTournamentCategory(g.tournamentId)}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                            <span style={{ color: 'var(--accent)' }}>{getTeamName(g.homeTeamId)}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>vs</span>
                                            <span style={{ color: 'var(--danger)' }}>{getTeamName(g.visitorTeamId)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                                            {g.field}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                                                {g.date}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                <Clock size={14} />
                                                {g.time}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(g)} className="btn-icon">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(g.id)} className="btn-icon delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentGame ? 'Editar Partido' : 'Nuevo Partido'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Torneo</label>
                        <select
                            value={formData.tournamentId}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    tournamentId: e.target.value,
                                    homeTeamId: '', // Reset teams when tournament/category changes
                                    visitorTeamId: ''
                                })
                            }}
                            required
                        >
                            <option value="" disabled>Seleccionar Torneo</option>
                            {tournaments.length === 0 ? (
                                <option disabled>No hay torneos creados</option>
                            ) : (
                                tournaments.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                                ))
                            )}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Equipo Local</label>
                            <select
                                value={formData.homeTeamId}
                                onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })}
                                required
                                disabled={!formData.tournamentId}
                            >
                                <option value="" disabled>Seleccionar</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id} disabled={t.id == formData.visitorTeamId}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Equipo Visitante</label>
                            <select
                                value={formData.visitorTeamId}
                                onChange={(e) => setFormData({ ...formData, visitorTeamId: e.target.value })}
                                required
                                disabled={!formData.tournamentId}
                            >
                                <option value="" disabled>Seleccionar</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id} disabled={t.id == formData.homeTeamId}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Cancha</label>
                        <input
                            type="text"
                            placeholder="Ej. Estadio Principal"
                            value={formData.field}
                            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Fecha</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Hora</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentGame ? 'Guardar Cambios' : 'Agendar Partido'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default Games
