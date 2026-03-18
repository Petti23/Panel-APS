// Tournaments Page
import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import { normalizeText } from '../utils/schedule/normalizeText'
import '../components/Table.css'

const Tournaments = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentTournament, setCurrentTournament] = useState(null)
    const [filterCategory, setFilterCategory] = useState('')
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <h1 style={{ fontSize: '2.25rem' }}>Gestión de Torneos</h1>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filtrar:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ width: 'auto', minWidth: '220px' }}
                        >
                            <option value="">Todas las Categorías</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={20} />
                        Nuevo Torneo
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Nombre del Torneo</th>
                            <th style={{ width: '20%' }}>Categoría</th>
                            <th style={{ width: '20%' }}>Fecha Inicio</th>
                            <th style={{ width: '15%' }}>Fecha Fin</th>
                            <th style={{ width: '15%', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournaments.filter(t => !filterCategory || normalizeText(t.category) === normalizeText(filterCategory)).length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '1rem', opacity: 0.2 }}><Calendar size={48} style={{ margin: '0 auto' }} /></div>
                                    No hay torneos registrados {filterCategory ? `en la categoría ${filterCategory}` : ''}
                                </td>
                            </tr>
                        ) : (
                            tournaments
                                .filter(t => !filterCategory || normalizeText(t.category) === normalizeText(filterCategory))
                                .map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 700, fontSize: '1.05rem', paddingLeft: '1.5rem' }}>{t.name}</td>
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
                                            {t.category}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 }}>
                                            <Calendar size={16} style={{ color: 'var(--primary)' }} />
                                            {new Date(t.startDate + 'T00:00:00').toLocaleDateString('es-AR')}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                                        {new Date(t.endDate + 'T00:00:00').toLocaleDateString('es-AR')}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenModal(t)} className="btn-icon" title="Editar">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="btn-icon delete" title="Eliminar">
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
