import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar, Clock, MapPin, Upload } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import '../components/Table.css'
import ExcelScheduleUploader from '../components/ExcelScheduleUploader'

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
        const matchesCategory = !filterCategory || getTournamentCategory(g.tournamentId) === filterCategory;
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
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem' }}>Programación de Partidos</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setIsExcelModalOpen(true)} className="btn btn-outline">
                            <Upload size={18} />
                            Subir Excel
                        </button>
                        <button onClick={() => handleOpenModal()} className="btn btn-primary">
                            <Plus size={18} />
                            Nuevo Partido
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoría</label>
                        <select value={filterCategory} onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setFilterTournament(''); // Reset tournament filter as it might not be in the new category
                        }}>
                            <option value="">Todas las Categorías</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Torneo Específico</label>
                        <select value={filterTournament} onChange={(e) => setFilterTournament(e.target.value)}>
                            <option value="">Todos los torneos</option>
                            {tournaments
                                .filter(t => !filterCategory || t.category === filterCategory)
                                .map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div style={{ width: '220px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fecha</label>
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                    </div>
                    {(filterTournament || filterCategory || filterDate) && (
                        <button className="btn btn-outline" style={{ padding: '0.6rem 1.25rem' }} onClick={() => { setFilterTournament(''); setFilterCategory(''); setFilterDate(''); }}>Limpiar</button>
                    )}
                </div>
            </div>

            {sortedTournamentIds.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '5rem 2rem', borderStyle: 'dashed', borderWidth: '2px' }}>
                    <div style={{ backgroundColor: 'var(--bg-primary)', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Calendar size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No hay partidos agendados</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Prueba cambiando los filtros o sube un archivo Excel.</p>
                </div>
            ) : (
                sortedTournamentIds.map(tId => (
                    <div key={tId} style={{ marginBottom: '3.5rem' }}>
                        <div style={{ 
                            padding: '1rem 0', 
                            borderBottom: '2px solid var(--primary)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{getTournamentName(tId)}</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                                    {getTournamentCategory(tId)}
                                </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {groupedGames[tId].length} Partidos
                            </span>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '45%' }}>Enfrentamiento</th>
                                        <th style={{ width: '25%' }}>Sede / Cancha</th>
                                        <th style={{ width: '18%' }}>Horario</th>
                                        <th style={{ width: '12%', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedGames[tId].map((g) => (
                                        <tr key={g.id}>
                                            <td style={{ paddingLeft: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                    <div style={{ flex: 1, textAlign: 'right', fontWeight: 800, fontSize: '1.1rem' }}>{getTeamName(g.homeTeamId)}</div>
                                                    <div style={{ 
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
                                                        color: 'var(--text-muted)'
                                                    }}>VS</div>
                                                    <div style={{ flex: 1, textAlign: 'left', fontWeight: 800, fontSize: '1.1rem' }}>{getTeamName(g.visitorTeamId)}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 500 }}>
                                                    <MapPin size={16} style={{ color: 'var(--accent)' }} />
                                                    {g.field}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                        <Calendar size={14} />
                                                        {new Date(g.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                        <Clock size={14} />
                                                        {g.time} HS
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleOpenModal(g)} className="btn-icon" title="Editar">
                                                        <Edit2 size={16} />
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

            <Modal isOpen={isExcelModalOpen} onClose={() => setIsExcelModalOpen(false)} title="Importar Programación">
                <ExcelScheduleUploader onUpload={(data) => {
                    const stats = importScheduleData(data);
                    alert(`Importación finalizada:\n- ${stats.addedGames} partidos nuevos\n- ${stats.addedTeams} equipos nuevos\n- ${stats.addedTournaments} torneos nuevos`);
                    setIsExcelModalOpen(false);
                }} />
            </Modal>
        </div>
    )
}

export default Games
