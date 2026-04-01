import { useState } from 'react'
import { Plus, SquarePen, Trash2, Trophy } from 'lucide-react'
import Modal from '../components/Modal'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import { normalizeText } from '../utils/schedule/normalizeText'
import '../components/Table.css'
import '../components/Pages.css'

const Tournaments = () => {
    const { tournaments, addTournament, updateTournament, deleteTournament } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentTournament, setCurrentTournament] = useState(null)
    const [filterCategory, setFilterCategory] = useState('')
    const [formData, setFormData] = useState({ name: '', category: CATEGORIES[0], startDate: '', endDate: '' })

    const handleOpenModal = (tournament = null) => {
        if (tournament) {
            setCurrentTournament(tournament)
            setFormData({ name: tournament.name, category: tournament.category || CATEGORIES[0], startDate: tournament.startDate || '', endDate: tournament.endDate || '' })
        } else {
            setCurrentTournament(null)
            setFormData({ name: '', category: CATEGORIES[0], startDate: '', endDate: '' })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => { setIsModalOpen(false); setCurrentTournament(null) }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentTournament) updateTournament(currentTournament.id, formData)
        else addTournament(formData)
        handleCloseModal()
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
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="5">
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
                                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(t.startDate)}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.endDate)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
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
        </div>
    )
}

export default Tournaments
