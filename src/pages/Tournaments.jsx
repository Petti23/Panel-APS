import { useState } from 'react'
import { Plus, SquarePen, Trash2, Trophy, CalendarDays, Users, Calendar, Clock, MapPin, FileSpreadsheet } from 'lucide-react'
import Modal from '../components/Modal'
import ExcelUploader from '../components/ExcelUploader'
import ScheduleExcelUploader from '../components/ScheduleExcelUploader'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import { normalizeText } from '../utils/schedule/normalizeText'
import '../components/Table.css'
import '../components/Pages.css'

const Tournaments = () => {
    const { 
        tournaments, addTournament, updateTournament, deleteTournament, 
        teams, players, addGame, addTeamToTournament, processRoster, fetchTournamentTeams, importTournamentSchedule
    } = useData()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGameModalOpen, setIsGameModalOpen] = useState(false)
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
    const [isRosterUploadOpen, setIsRosterUploadOpen] = useState(false)
    const [isScheduleUploadOpen, setIsScheduleUploadOpen] = useState(false)
    
    const [tournamentTeams, setTournamentTeams] = useState([])
    const [isLoadingTeams, setIsLoadingTeams] = useState(false)
    const [teamModalStep, setTeamModalStep] = useState(1) // 1: Team, 2: Players
    const [selectedTeamId, setSelectedTeamId] = useState('')
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
    const [playerSearch, setPlayerSearch] = useState('')

    const [currentTournament, setCurrentTournament] = useState(null)
    const [filterCategory, setFilterCategory] = useState('')
    const [formData, setFormData] = useState({ name: '', season: new Date().getFullYear(), category: CATEGORIES[0], startDate: '', endDate: '' })

    const [gameData, setGameData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        field: '',
        homeTeamId: '',
        visitorTeamId: ''
    })

    const handleOpenModal = (tournament = null) => {
        if (tournament) {
            setCurrentTournament(tournament)
            setFormData({ name: tournament.name, season: tournament.season || new Date().getFullYear(), category: tournament.category || CATEGORIES[0], startDate: tournament.startDate || '', endDate: tournament.endDate || '' })
        } else {
            setCurrentTournament(null)
            setFormData({ name: '', season: new Date().getFullYear(), category: CATEGORIES[0], startDate: '', endDate: '' })
        }
        setIsModalOpen(true)
    }

    const handleOpenGameModal = async (tournament) => {
        setCurrentTournament(tournament)
        setIsLoadingTeams(true)
        try {
            const tt = await fetchTournamentTeams(tournament.id)
            setTournamentTeams(tt.map(item => ({
                id: item.team.team_id,
                name: item.team.name,
                club: item.team.club
            })))
        } catch (err) {
            console.error('Error fetching tournament teams:', err)
            setTournamentTeams([])
        } finally {
            setIsLoadingTeams(false)
        }
        
        setGameData({
            date: new Date().toISOString().split('T')[0],
            time: '18:00',
            field: '',
            homeTeamId: '',
            visitorTeamId: ''
        })
        setIsGameModalOpen(true)
    }

    const handleOpenTeamModal = (tournament) => {
        setCurrentTournament(tournament)
        setTeamModalStep(1)
        setSelectedTeamId('')
        setIsTeamModalOpen(true)
    }

    const handleCloseModal = () => { setIsModalOpen(false); setCurrentTournament(null) }
    const handleCloseGameModal = () => { setIsGameModalOpen(false); setCurrentTournament(null) }
    const handleCloseTeamModal = () => { setIsTeamModalOpen(false); setCurrentTournament(null) }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentTournament) updateTournament(currentTournament.id, formData)
        else addTournament(formData)
        handleCloseModal()
    }

    const handleGameSubmit = (e) => {
        e.preventDefault()
        if (!gameData.homeTeamId || !gameData.visitorTeamId) return alert('Debes seleccionar ambos equipos')
        if (gameData.homeTeamId === gameData.visitorTeamId) return alert('Los equipos deben ser diferentes')
        
        addGame({
            tournamentId: currentTournament.id,
            ...gameData
        })
        handleCloseGameModal()
    }

    const handleTeamSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTeamId) return alert('Selecciona un equipo')
        setIsRosterUploadOpen(true)
    }

    const handleRosterUpload = async (playersData) => {
        try {
            await processRoster(currentTournament.id, selectedTeamId, playersData)
            alert('Equipo y roster vinculados correctamente')
            setIsRosterUploadOpen(false)
            handleCloseTeamModal()
        } catch (err) {
            alert('Error al procesar roster: ' + err.message)
        }
    }

    const handleScheduleUpload = async (scheduleRows) => {
        try {
            const count = await importTournamentSchedule(currentTournament.id, scheduleRows)
            alert(`Se importaron ${count} partidos correctamente.`)
            setIsScheduleUploadOpen(false)
        } catch (err) {
            alert('Error al importar fixture: ' + err.message)
        }
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este torneo?')) deleteTournament(id)
    }

    const filtered = tournaments.filter(t => !filterCategory || normalizeText(t.category) === normalizeText(filterCategory))

    const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>Torneos</h1>
                    <p>{tournaments.length} torneos registrados</p>
                </div>
                <div className="page-actions">
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={17} />
                        Nuevo Torneo
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group wide">
                    <label>Filtrar por Categoría</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="">Todas las Categorías</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {filterCategory && (
                    <button className="btn btn-outline btn-sm filter-clear-btn" onClick={() => setFilterCategory('')}>
                        Limpiar
                    </button>
                )}
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre del Torneo</th>
                            <th>Categoría</th>
                            <th>Temporada</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state" style={{ border: 'none', padding: '3rem' }}>
                                        <div className="empty-state-icon"><Trophy size={22} /></div>
                                        <h3>Sin torneos</h3>
                                        <p>{filterCategory ? `No hay torneos en la categoría ${filterCategory}.` : 'Creá el primer torneo.'}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((t) => (
                                        <tr key={t.id}>
                                    <td style={{ fontWeight: 700 }}>{t.name}</td>
                                    <td><span className="category-badge">{t.category}</span></td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{t.season}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(t.startDate)}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.endDate)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setCurrentTournament(t); setIsScheduleUploadOpen(true) }} className="btn-icon" title="Subir Fixture (Excel)" style={{ color: 'var(--primary)' }}><FileSpreadsheet size={16} /></button>
                                            <button onClick={() => handleOpenGameModal(t)} className="btn-icon" title="Agregar Partido" style={{ color: 'var(--primary)' }}><CalendarDays size={16} /></button>
                                            <button onClick={() => handleOpenTeamModal(t)} className="btn-icon" title="Agregar Equipos" style={{ color: 'var(--success)' }}><Users size={16} /></button>
                                            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 4px' }}></div>
                                            <button onClick={() => handleOpenModal(t)} className="btn-icon" title="Editar"><SquarePen size={16} /></button>
                                            <button onClick={() => handleDelete(t.id)} className="btn-icon delete" title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentTournament ? 'Editar Torneo' : 'Nuevo Torneo'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Torneo</label>
                        <input
                            type="text"
                            placeholder="Ej. Torneo Apertura"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required autoFocus
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoría</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Temporada</label>
                            <input
                                type="number"
                                min="2000"
                                max="2100"
                                value={formData.season}
                                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha Inicio</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Fin</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentTournament ? 'Guardar Cambios' : 'Crear Torneo'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isGameModalOpen} onClose={handleCloseGameModal} title={`Nuevo Partido - ${currentTournament?.name}`}>
                <form onSubmit={handleGameSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label><Calendar size={14} /> Fecha</label>
                            <input type="date" value={gameData.date} onChange={(e) => setGameData({ ...gameData, date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label><Clock size={14} /> Hora</label>
                            <input type="time" value={gameData.time} onChange={(e) => setGameData({ ...gameData, time: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label><MapPin size={14} /> Cancha / Campo</label>
                        <input type="text" placeholder="Ej. Campo 1" value={gameData.field} onChange={(e) => setGameData({ ...gameData, field: e.target.value })} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Equipo Local</label>
                            <select value={gameData.homeTeamId} onChange={(e) => setGameData({ ...gameData, homeTeamId: e.target.value })} required>
                                <option value="">Seleccionar...</option>
                                {isLoadingTeams ? (
                                    <option disabled>Cargando equipos...</option>
                                ) : tournamentTeams.length === 0 ? (
                                    <option disabled>No hay equipos vinculados</option>
                                ) : (
                                    tournamentTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Equipo Visitante</label>
                            <select value={gameData.visitorTeamId} onChange={(e) => setGameData({ ...gameData, visitorTeamId: e.target.value })} required>
                                <option value="">Seleccionar...</option>
                                {isLoadingTeams ? (
                                    <option disabled>Cargando equipos...</option>
                                ) : tournamentTeams.length === 0 ? (
                                    <option disabled>No hay equipos vinculados</option>
                                ) : (
                                    tournamentTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)
                                )}
                            </select>
                        </div>
                    </div>
                    {tournamentTeams.length === 0 && !isLoadingTeams && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            ⚠ Debes vincular equipos al torneo antes de crear partidos.
                        </p>
                    )}
                    <div className="form-actions">
                        <button type="button" onClick={handleCloseGameModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Crear Partido</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTeamModalOpen} onClose={handleCloseTeamModal} title={`Vincular Equipo - ${currentTournament?.name}`}>
                <form onSubmit={handleTeamSubmit}>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Selecciona el equipo que participará y luego carga su roster mediante Excel.
                    </p>
                    <div className="form-group">
                        <label>Equipo</label>
                        <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} required>
                            <option value="">Seleccionar equipo...</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name} ({team.club || 'Sin club'})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                        <button type="button" onClick={handleCloseTeamModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={!selectedTeamId}>
                            Siguiente: Cargar Roster (Excel)
                        </button>
                    </div>
                </form>
            </Modal>

            <ExcelUploader 
                isOpen={isRosterUploadOpen}
                onClose={() => setIsRosterUploadOpen(false)}
                team={teams.find(t => t.id === selectedTeamId)}
                onUpload={handleRosterUpload}
            />

            <ScheduleExcelUploader 
                isOpen={isScheduleUploadOpen}
                onClose={() => setIsScheduleUploadOpen(false)}
                tournament={currentTournament}
                onUpload={handleScheduleUpload}
            />
        </div>
    )
}

export default Tournaments
