import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Upload } from 'lucide-react'
import Modal from '../components/Modal'
import ExcelUploader from '../components/ExcelUploader'
import { useData } from '../context/DataContext'
import { CATEGORIES } from '../constants/categories'
import '../components/Table.css'

const Teams = () => {
    const { teams, addTeam, updateTeam, deleteTeam, addPlayer, addPlayers } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentTeam, setCurrentTeam] = useState(null)
    const [formData, setFormData] = useState({ name: '', category: CATEGORIES[0] })
    const [filterCategory, setFilterCategory] = useState('Todas')

    // Excel Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [uploadTargetTeam, setUploadTargetTeam] = useState(null)

    const handleOpenModal = (team = null) => {
        if (team) {
            setCurrentTeam(team)
            setFormData({ name: team.name, category: team.category })
        } else {
            setCurrentTeam(null)
            setFormData({ name: '', category: CATEGORIES[0] })
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setCurrentTeam(null)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (currentTeam) {
            updateTeam(currentTeam.id, formData)
        } else {
            addTeam(formData)
        }
        handleCloseModal()
    }

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este equipo?')) {
            deleteTeam(id)
        }
    }

    // --- Excel Upload Handlers ---
    const handleOpenUpload = (team) => {
        setUploadTargetTeam(team)
        setIsUploadModalOpen(true)
    }

    const handleUploadPlayers = (playersData) => {
        if (!uploadTargetTeam) return

        // Check if playersData is valid and not empty
        if (!playersData || playersData.length === 0) {
            alert("No se encontraron jugadores para cargar.")
            return
        }

        // Prepare the players with teamId and category linkage
        const preparedPlayers = playersData.map(player => ({
            ...player,
            teamId: uploadTargetTeam.id,
            category: uploadTargetTeam.category
        }))

        // Use the bulk add method
        addPlayers(preparedPlayers)

        alert(`Se cargaron ${playersData.length} jugadores exitosamente al equipo ${uploadTargetTeam.name}`)
        setIsUploadModalOpen(false)
        setUploadTargetTeam(null)
    }

    const filteredTeams = filterCategory === 'Todas'
        ? teams
        : teams.filter(t => t.category === filterCategory)

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <h1 style={{ fontSize: '2.25rem' }}>Lista de Equipos</h1>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filtrar:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ width: 'auto', minWidth: '220px' }}
                        >
                            <option value="Todas">Todas las Categorías</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={20} />
                        Nuevo Equipo
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50%', paddingLeft: '1.5rem' }}>Equipo</th>
                            <th style={{ width: '30%' }}>Categoría</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeams.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                                    <div style={{ marginBottom: '1rem', opacity: 0.2 }}><Shield size={48} style={{ margin: '0 auto' }} /></div>
                                    No hay equipos registrados en esta categoría
                                </td>
                            </tr>
                        ) : (
                            filteredTeams.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 700, fontSize: '1.1rem', paddingLeft: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                backgroundColor: 'var(--bg-primary)', 
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--primary)',
                                                border: '1px solid var(--border-light)'
                                            }}>
                                                <Shield size={20} />
                                            </div>
                                            {t.name}
                                        </div>
                                    </td>
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
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleOpenUpload(t)}
                                                className="btn-icon"
                                                title="Cargar Lista de Buena Fé"
                                            >
                                                <Upload size={18} />
                                            </button>
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
                title={currentTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Nombre del Equipo</label>
                        <input
                            type="text"
                            placeholder="Ej. Cardenales"
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentTeam ? 'Guardar Cambios' : 'Crear Equipo'}</button>
                    </div>
                </form>
            </Modal>

            {/* Excel Upload Modal */}
            <ExcelUploader
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                team={uploadTargetTeam}
                onUpload={handleUploadPlayers}
            />
        </div>
    )
}

export default Teams
