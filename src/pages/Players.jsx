import { useState } from 'react'
import { Plus, Edit2, Trash2, User, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import '../components/Table.css'

const Players = () => {
    const { players, teams, addPlayer, updatePlayer, deletePlayer } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPlayer, setCurrentPlayer] = useState(null)

    // Form State
    const [formData, setFormData] = useState({ fullName: '', dni: '', category: '', teamId: '' })

    // Filter State
    const [filterCategory, setFilterCategory] = useState('Todas')
    const [filterTeam, setFilterTeam] = useState('Todos')
    const [searchTerm, setSearchTerm] = useState('')

    const handleOpenModal = (player = null) => {
        if (player) {
            setCurrentPlayer(player)
            setFormData({
                fullName: player.fullName,
                dni: player.dni,
                category: player.category,
                teamId: player.teamId
            })
        } else {
            setCurrentPlayer(null)
            // Default to first category available
            setFormData({ fullName: '', dni: '', category: CATEGORIES[0], teamId: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentPlayer(null)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentPlayer) {
            updatePlayer(currentPlayer.id, formData)
        } else {
            addPlayer(formData)
        }
        handleCloseModal()
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este jugador?')) {
            deletePlayer(id)
        }
    }

    // Get teams available for the selected category in the form
    const availableTeams = teams.filter(t => t.category === formData.category)

    // Filtered Players for Table
    const filteredPlayers = players.filter(p => {
        const matchesCategory = filterCategory === 'Todas' || p.category === filterCategory
        const matchesTeam = filterTeam === 'Todos' || p.teamId == filterTeam
        const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.dni.includes(searchTerm)
        return matchesCategory && matchesTeam && matchesSearch
    })

    const teamsForFilter = filterCategory === 'Todas'
        ? teams
        : teams.filter(t => t.category === filterCategory)

    const getTeamName = (id) => teams.find(t => t.id == id)?.name || 'Sin Equipo'

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem' }}>Registro de Jugadores</h1>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={20} />
                        Nuevo Jugador
                    </button>
                </div>

                <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid var(--border)' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categoría</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value)
                                setFilterTeam('Todos')
                            }}
                        >
                            <option value="Todas">Todas las Categorías</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Equipo</label>
                        <select
                            value={filterTeam}
                            onChange={(e) => setFilterTeam(e.target.value)}
                        >
                            <option value="Todos">Todos los Equipos</option>
                            {teamsForFilter.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: '2', minWidth: '300px', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Búsqueda Rápida</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '2.8rem', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '35%', paddingLeft: '1.5rem' }}>Jugador</th>
                            <th style={{ width: '15%' }}>DNI</th>
                            <th style={{ width: '20%' }}>Equipo</th>
                            <th style={{ width: '18%' }}>Categoría</th>
                            <th style={{ width: '12%', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlayers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '1rem', opacity: 0.2 }}><User size={48} style={{ margin: '0 auto' }} /></div>
                                    No se encontraron jugadores
                                </td>
                            </tr>
                        ) : (
                            filteredPlayers.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 700, fontSize: '1.05rem', paddingLeft: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ 
                                                width: '36px', 
                                                height: '36px', 
                                                backgroundColor: 'var(--bg-primary)', 
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--border-light)'
                                            }}>
                                                <User size={18} />
                                            </div>
                                            {p.fullName}
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>{p.dni}</td>
                                    <td style={{ fontWeight: 600 }}>{getTeamName(p.teamId)}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--accent)',
                                            padding: '0.35rem 0.85rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            border: '1px solid var(--border-light)'
                                        }}>
                                            {p.category}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(p)} className="btn-icon" title="Editar">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="btn-icon delete" title="Eliminar">
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
                title={currentPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Nombre Completo</label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Perez"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>DNI</label>
                        <input
                            type="text"
                            placeholder="Ej. 12.345.678"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Categoría</label>
                            <select
                                value={formData.category}
                                onChange={(e) => {
                                    setFormData({ ...formData, category: e.target.value, teamId: '' })
                                }}
                                required
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Equipo</label>
                            <select
                                value={formData.teamId}
                                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                                required
                                disabled={!formData.category}
                            >
                                <option value="" disabled>Seleccionar Equipo</option>
                                {availableTeams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                                {availableTeams.length === 0 && (
                                    <option disabled>No hay equipos en esta categoría</option>
                                )}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentPlayer ? 'Guardar Cambios' : 'Crear Jugador'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default Players
