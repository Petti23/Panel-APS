import { useState } from 'react'
import { Plus, SquarePen, Trash2, Shield, Upload } from 'lucide-react'
import Modal from '../components/Modal'
import ExcelUploader from '../components/ExcelUploader'
import { useData } from '../context/DataContext'
import '../components/Table.css'
import '../components/Pages.css'

const Teams = () => {
    const { teams, addTeam, updateTeam, deleteTeam, addPlayers } = useData()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentTeam, setCurrentTeam] = useState(null)
    const [formData, setFormData] = useState({ name: '', club: '' })
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [uploadTargetTeam, setUploadTargetTeam] = useState(null)

    const handleOpenModal = (team = null) => {
        if (team) {
            setCurrentTeam(team)
            setFormData({ name: team.name, club: team.club || '' })
        } else {
            setCurrentTeam(null)
            setFormData({ name: '', club: '' })
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
        if (window.confirm('¿Estás seguro de eliminar este equipo?')) deleteTeam(id)
    }

    const handleOpenUpload = (team) => {
        setUploadTargetTeam(team)
        setIsUploadModalOpen(true)
    }

    const handleUploadPlayers = (playersData) => {
        if (!uploadTargetTeam) return
        if (!playersData || playersData.length === 0) {
            alert('No se encontraron jugadores para cargar.')
            return
        }
        addPlayers(playersData.map(p => ({ ...p })))
        alert(`Se cargaron ${playersData.length} jugadores para el equipo ${uploadTargetTeam.name}`)
        setIsUploadModalOpen(false)
        setUploadTargetTeam(null)
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div className="page-title-group">
                    <h1>Equipos</h1>
                    <p>{teams.length} equipos registrados</p>
                </div>
                <div className="page-actions">
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus size={17} />
                        Nuevo Equipo
                    </button>
                </div>
            </div>



            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>Club</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.length === 0 ? (
                            <tr>
                                <td colSpan="3">
                                    <div className="empty-state" style={{ border: 'none', padding: '3rem' }}>
                                        <div className="empty-state-icon"><Shield size={22} /></div>
                                        <h3>Sin equipos registrados</h3>
                                        <p>No hay equipos en esta categoría.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            teams.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="team-cell">
                                            <div className="team-icon"><Shield size={18} /></div>
                                            <span style={{ fontWeight: 700 }}>{t.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.club || '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleOpenUpload(t)} className="btn-icon" title="Cargar jugadores (Excel)">
                                                <Upload size={16} />
                                            </button>
                                            <button onClick={() => handleOpenModal(t)} className="btn-icon" title="Editar">
                                                <SquarePen size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(t.id)} className="btn-icon delete" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentTeam ? 'Editar Equipo' : 'Nuevo Equipo'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Equipo</label>
                        <input
                            type="text"
                            placeholder="Ej. Cardenales"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Club (opcional)</label>
                        <input
                            type="text"
                            placeholder="Ej. Club Atlético"
                            value={formData.club}
                            onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={handleCloseModal} className="btn btn-outline">Cancelar</button>
                        <button type="submit" className="btn btn-primary">{currentTeam ? 'Guardar Cambios' : 'Crear Equipo'}</button>
                    </div>
                </form>
            </Modal>

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
