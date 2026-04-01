import { useState } from 'react'
import { Plus, Edit2, Trash2, User, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import '../components/Table.css'
import '../components/Pages.css'

const Players = () => {
    const { players, teams, addPlayer, updatePlayer, deletePlayer } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPlayer, setCurrentPlayer] = useState(null)
    const [formData, setFormData] = useState({ fullName: '', dni: '', category: '', teamId: '' })
    const [filterCategory, setFilterCategory] = useState('Todas')
    const [filterTeam, setFilterTeam] = useState('Todos')
    const [searchTerm, setSearchTerm] = useState('')

    const handleOpenModal = (player = null) => {
        if (player) {
            setCurrentPlayer(player)
            setFormData({ fullName: player.fullName, dni: player.dni, category: player.category, teamId: player.teamId })
        } else {
            setCurrentPlayer(null)
            setFormData({ fullName: '', dni: '', category: CATEGORIES[0], teamId: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => { setIsModalOpen(false); setCurrentPlayer(null) }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentPlayer) updatePlayer(currentPlayer.id, formData)
        else addPlayer(formData)
        handleCloseModal()
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este jugador?')) deletePlayer(id)
    }

    const availableTeams = teams.filter(t => t.category === formData.category)
    const teamsForFilter = filterCategory === 'Todas' ? teams : teams.filter(t => t.category === filterCategory)
    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Sin Equipo'

    const filteredPlayers = players.filter(p => {
        const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory
        const matchesTeam     = filterTeam === 'Todos' || p.teamId == filterTeam
        const matchesSearch   = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || p.dni.includes(searchTerm)
        return matchesCategory && matchesTeam && matchesSearch
    })

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>Jugadores</h1>
                    <p>{players.length} jugadores registrados</p>
                </div>
                <div className="page-actions">
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={17} />
                        Nuevo Jugador
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label>Categoría</label>
                    <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterTeam('Todos') }}>
                        <option value="Todas">Todas las Categorías</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Equipo</label>
                    <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
                        <option value="Todos">Todos los Equipos</option>
                        {teamsForFilter.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="filter-group wide">
                    <label>Búsqueda</label>
                    <div className="filter-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Jugador</th>
                            <th>DNI</th>
                            <th>Equipo</th>
                            <th>Categoría</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlayers.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    <div className="empty-state" style={{ border: 'none', padding: '3rem' }}>
                                        <div className="empty-state-icon"><User size={22} /></div>
                                        <h3>Sin jugadores</h3>
                                        <p>No se encontraron jugadores con los filtros aplicados.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredPlayers.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="team-cell">
                                            <div className="team-icon" style={{ borderRadius: '50%' }}><User size={16} /></div>
                                            <span style={{ fontWeight: 700 }}>{p.fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.dni}</td>
                                    <td style={{ fontWeight: 600 }}>{getTeamName(p.teamId)}</td>
                                    <td><span className="category-badge">{p.category}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(p)} className="btn-icon" title="Editar"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(p.id)} className="btn-icon delete" title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>DNI</label>
                        <input
                            type="text"
                            placeholder="Ej. 12.345.678"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoría</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value, teamId: '' })}
                                required
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Equipo</label>
                            <select
                                value={formData.teamId}
                                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                                required
                                disabled={!formData.category}
                            >
                                <option value="" disabled>Seleccionar Equipo</option>
                                {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                {availableTeams.length === 0 && <option disabled>Sin equipos en esta categoría</option>}
                            </select>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentPlayer ? 'Guardar Cambios' : 'Crear Jugador'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default Players

