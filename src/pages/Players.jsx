import { useState } from 'react'
import { Plus, SquarePen, Trash2, User, Search } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import '../components/Table.css'
import '../components/Pages.css'

const Players = () => {
    const { players, addPlayer, updatePlayer, deletePlayer } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPlayer, setCurrentPlayer] = useState(null)
    const [formData, setFormData] = useState({ fullName: '', dni: '' })
    const [searchTerm, setSearchTerm] = useState('')

    const handleOpenModal = (player = null) => {
        if (player) {
            setCurrentPlayer(player)
            setFormData({ fullName: player.fullName, dni: player.dni || '' })
        } else {
            setCurrentPlayer(null)
            setFormData({ fullName: '', dni: '' })
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

    const filteredPlayers = players.filter(p => {
        const matchesSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            || (p.dni || '').includes(searchTerm)
        return matchesSearch
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
                            <th>DNI / ID Nacional</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlayers.length === 0 ? (
                            <tr>
                                <td colSpan="3">
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
                                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{p.dni || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(p)} className="btn-icon" title="Editar"><SquarePen size={16} /></button>
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
                        <label>DNI / ID Nacional (opcional)</label>
                        <input
                            type="text"
                            placeholder="Ej. 12.345.678"
                            value={formData.dni}
                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        />
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

