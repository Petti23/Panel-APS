import { useState } from 'react'
import { Plus, SquarePen, Trash2, Calendar, Clock, MapPin, Upload } from 'lucide-react'
import Modal from '../components/Modal'
import UploadDrawer from '../components/UploadDrawer'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import { normalizeText } from '../utils/schedule/normalizeText'
import '../components/Table.css'
import '../components/Pages.css'

const Games = () => {
    const { games, tournaments, teams, addGame, updateGame, deleteGame, importScheduleData } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
    const [currentGame, setCurrentGame] = useState(null)

    const [filterTournament, setFilterTournament] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [filterDate, setFilterDate] = useState('')

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
            setFormData({
                tournamentId: filterTournament || '', // Pre-select current filter if any
                homeTeamId: '',
                visitorTeamId: '',
                field: '',
                date: filterDate || '',
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

    // 1. Filter games
    const filteredGames = games.filter(g => {
        const matchesTournament = !filterTournament || g.tournamentId == filterTournament;
        const tournamentCat = getTournamentCategory(g.tournamentId);
        const matchesCategory = !filterCategory || normalizeText(tournamentCat) === normalizeText(filterCategory);
        const matchesDate = !filterDate || g.date === filterDate;
        return matchesTournament && matchesCategory && matchesDate;
    }).sort((a, b) => {
        // Sort by date and time
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });

    // 2. Group by tournament
    const groupedGames = filteredGames.reduce((acc, game) => {
        const tId = game.tournamentId;
        if (!acc[tId]) acc[tId] = [];
        acc[tId].push(game);
        return acc;
    }, {});

    const sortedTournamentIds = Object.keys(groupedGames).sort((a, b) => 
        getTournamentName(a).localeCompare(getTournamentName(b))
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>Programación de Partidos</h1>
                </div>
                <div className="page-actions">
                    <button onClick={() => setIsExcelModalOpen(true)} className="btn btn-outline">
                        <Upload size={17} />
                        Subir Excel
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={17} />
                        Nuevo Partido
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label>Categoría</label>
                    <select value={filterCategory} onChange={(e) => {
                        setFilterCategory(e.target.value);
                        setFilterTournament('');
                    }}>
                        <option value="">Todas las Categorías</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group wide">
                    <label>Torneo</label>
                    <select value={filterTournament} onChange={(e) => setFilterTournament(e.target.value)}>
                        <option value="">Todos los torneos</option>
                        {tournaments
                            .filter(t => !filterCategory || normalizeText(t.category) === normalizeText(filterCategory))
                            .map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))
                        }
                    </select>
                </div>

                <div className="filter-group">
                    <label>Fecha</label>
                    <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>

                {(filterTournament || filterCategory || filterDate) && (
                    <button className="btn btn-outline btn-sm filter-clear-btn"
                        onClick={() => { setFilterTournament(''); setFilterCategory(''); setFilterDate(''); }}>
                        Limpiar filtros
                    </button>
                )}
            </div>

            {sortedTournamentIds.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Calendar size={22} /></div>
                    <h3>No hay partidos agendados</h3>
                    <p>Probá cambiando los filtros o subí un archivo Excel.</p>
                </div>
            ) : (
                sortedTournamentIds.map(tId => (
                    <div key={tId} style={{ marginBottom: '3rem' }}>
                        <div className="section-divider">
                            <div>
                                <h3>{getTournamentName(tId)}</h3>
                                <div className="section-divider-category">{getTournamentCategory(tId)}</div>
                            </div>
                            <span className="section-divider-count">{groupedGames[tId].length} Partidos</span>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '45%' }}>Enfrentamiento</th>
                                        <th className="col-field" style={{ width: '25%' }}>Sede / Cancha</th>
                                        <th style={{ width: '18%' }}>Horario</th>
                                        <th style={{ width: '12%', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedGames[tId].map((g) => (
                                        <tr key={g.id}>
                                            <td style={{ paddingLeft: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="game-matchup-home" style={{ flex: 1, textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>{getTeamName(g.homeTeamId)}</div>
                                                    <div className="game-vs-badge" style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--bg-primary)',
                                                        border: '1px solid var(--border)',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 900,
                                                        color: 'var(--text-muted)',
                                                        flexShrink: 0
                                                    }}>VS</div>
                                                    <div className="game-matchup-away" style={{ flex: 1, textAlign: 'left', fontWeight: 800, fontSize: '1rem' }}>{getTeamName(g.visitorTeamId)}</div>
                                                </div>
                                            </td>
                                            <td className="col-field">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 500 }}>
                                                    <MapPin size={16} style={{ color: 'var(--accent)' }} />
                                                    {g.field}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                                        <Calendar size={13} />
                                                        {new Date(g.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        <Clock size={13} />
                                                        {g.time} HS
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleOpenModal(g)} className="btn-icon" title="Editar">
                                                        <SquarePen size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(g.id)} className="btn-icon delete" title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentGame ? 'Editar Partido' : 'Nuevo Partido'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Torneo</label>
                        <select
                            value={formData.tournamentId}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    tournamentId: e.target.value,
                                    homeTeamId: '',
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

                    <div className="form-row">
                        <div className="form-group">
                            <label>Equipo Local</label>
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
                        <div className="form-group">
                            <label>Equipo Visitante</label>
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

                    <div className="form-group">
                        <label>Cancha</label>
                        <input
                            type="text"
                            placeholder="Ej. Estadio Principal"
                            value={formData.field}
                            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentGame ? 'Guardar Cambios' : 'Agendar Partido'}</button>
                    </div>
                </form>
            </Modal>

            <UploadDrawer
                isOpen={isExcelModalOpen}
                onClose={() => setIsExcelModalOpen(false)}
                onUpload={async (data) => {
                    try {
                        const stats = await importScheduleData(data)
                        alert(`Importación finalizada:\n- ${stats.addedTournaments} torneos nuevos\n- ${stats.addedTeams} equipos nuevos\n- ${stats.addedGames} partidos nuevos`)
                    } catch (err) {
                        console.error('Error importando datos:', err)
                        alert(`Error al importar: ${err.message}`)
                    }
                }}
            />
        </div>
    )
}

export default Games
