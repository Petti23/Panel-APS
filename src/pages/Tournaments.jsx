// Tournaments Page
import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import '../components/Table.css'

const Tournaments = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentTournament, setCurrentTournament] = useState(null)
    const [formData, setFormData] = useState({ name: '', category: CATEGORIES[0], startDate: '', endDate: '' })

    const handleOpenModal = (tournament = null) => {
        if (tournament) {
            setCurrentTournament(tournament)
            setFormData({
                name: tournament.name,
                category: tournament.category || CATEGORIES[0],
                startDate: tournament.startDate,
                endDate: tournament.endDate
            })
        } else {
            setCurrentTournament(null)
            setFormData({ name: '', category: CATEGORIES[0], startDate: '', endDate: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentTournament(null)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentTournament) {
            updateTournament(currentTournament.id, formData)
        } else {
            addTournament(formData)
        }
        handleCloseModal()
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este torneo?')) {
            deleteTournament(id)
        }
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', width: '100%' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Torneos</h2>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus size={20} />
                    Nuevo Torneo
                </button>
            </div>

            <div className="card table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Fin</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournaments.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No hay torneos registrados
                                </td>
                            </tr>
                        ) : (
                            tournaments.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                            color: 'var(--accent)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                                            {t.startDate}
                                        </div>
                                    </td>
                                    <td>{t.endDate}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(t)} className="btn-icon">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="btn-icon delete">
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
                title={currentTournament ? 'Editar Torneo' : 'Nuevo Torneo'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Nombre del Torneo</label>
                        <input
                            type="text"
                            placeholder="Ej. Torneo Apertura"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Categoría</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Fecha Inicio</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Fecha Fin</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentTournament ? 'Guardar Cambios' : 'Crear Torneo'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default Tournaments
