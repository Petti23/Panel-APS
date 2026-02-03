import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, AlertTriangle, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react'
import Modal from './Modal'
import { validatePlayerRow } from '../utils/sanitizer'
import './Table.css'

const ExcelUploader = ({ isOpen, onClose, team, category, onUpload }) => {
    const [file, setFile] = useState(null)
    const [previewData, setPreviewData] = useState([])
    const [errors, setErrors] = useState([])
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef(null)

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0]
        setFile(selectedFile)
        if (selectedFile) {
            processFile(selectedFile)
        }
    }

    const processFile = (file) => {
        setIsProcessing(true)
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                // Use header: 1 to get an array of arrays, avoiding issues with missing headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

                const processed = []
                const validationErrors = []

                jsonData.forEach((row, index) => {
                    const result = validatePlayerRow(row)
                    // Skip completely empty rows seamlessly
                    if (result.isEmpty) return;

                    if (result.isValid) {
                        processed.push({ ...result.data, originalIndex: index })
                    } else {
                        validationErrors.push({ row: index + 2, errors: result.errors, data: row })
                    }
                })

                setPreviewData(processed)
                setErrors(validationErrors)
            } catch (error) {
                console.error("Error parsing file", error)
                setErrors([{ row: 'General', errors: ['Error al leer el archivo. Asegúrate que sea un Excel válido.'] }])
            } finally {
                setIsProcessing(false)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handleConfirm = () => {
        onUpload(previewData)
        handleClose()
    }

    const handleClose = () => {
        setFile(null)
        setPreviewData([])
        setErrors([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        onClose()
    }

    if (!isOpen) return null

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Cargar Lista de Buena Fé - ${team?.name}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Upload Section */}
                {!file && (
                    <div
                        style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '3rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            color: 'var(--text-secondary)'
                        }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <Upload size={48} />
                        <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Haz clic para subir el archivo Excel</p>
                            <p style={{ fontSize: '0.875rem' }}>Formato esperado: Nombre, Apellido, DNI</p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {/* Processing State */}
                {isProcessing && <p>Procesando archivo...</p>}

                {/* Preview Section */}
                {file && !isProcessing && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)' }}>
                            <FileSpreadsheet size={24} style={{ color: 'var(--success)' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600 }}>{file.name}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {previewData.length} jugadores válidos encontrados
                                </p>
                            </div>
                            <button onClick={() => { setFile(null); setPreviewData([]); setErrors([]) }} className="btn-icon">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {errors.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <AlertTriangle size={18} />
                                    Errores Detectados ({errors.length})
                                </h4>
                                <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    {errors.slice(0, 5).map((err, i) => (
                                        <li key={i}>Fila {err.row}: {err.errors.join(', ')}</li>
                                    ))}
                                    {errors.length > 5 && <li>... y {errors.length - 5} errores más.</li>}
                                </ul>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Estas filas serán ignoradas.
                                </p>
                            </div>
                        )}

                        <h4 style={{ marginBottom: '1rem' }}>Vista Previa (Primeros 5)</h4>
                        <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre Completo</th>
                                        <th>DNI</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.fullName}</td>
                                            <td>{p.dni}</td>
                                            <td style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <CheckCircle size={14} /> Válido
                                            </td>
                                        </tr>
                                    ))}
                                    {previewData.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No hay datos válidos para mostrar</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={handleClose} className="btn btn-outline">Cancelar</button>
                            <button
                                onClick={handleConfirm}
                                className="btn btn-primary"
                                disabled={previewData.length === 0}
                            >
                                Confirmar Carga
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ExcelUploader
