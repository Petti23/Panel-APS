import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import { Upload, TriangleAlert, CircleCheck, CircleX, FileSpreadsheet } from 'lucide-react'
import Modal from './Modal'
import { parseSimpleSchedule } from '../utils/schedule/parseSimpleSchedule'
import './Table.css'

const ScheduleExcelUploader = ({ isOpen, onClose, tournament, onUpload }) => {
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

    const processFile = async (file) => {
        setIsProcessing(true)
        try {
            const buffer = await file.arrayBuffer()
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(buffer)
            const worksheet = workbook.worksheets[0]

            const jsonData = []
            worksheet.eachRow({ includeEmpty: false }, (row) => {
                const rowData = []
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    while (rowData.length < colNumber - 1) rowData.push('')
                    const v = cell.value
                    if (v === null || v === undefined) { rowData.push(''); return }
                    
                    // Caso especial: Hora de Excel (numérico o fecha en 1899)
                    if (typeof v === 'number' && v < 1) {
                        // Es una fracción de día (hora)
                        const totalMinutes = Math.round(v * 24 * 60);
                        const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                        const m = (totalMinutes % 60).toString().padStart(2, '0');
                        rowData.push(`${h}:${m}`);
                        return;
                    }

                    if (v instanceof Date && v.getFullYear() < 1905) {
                        // Intentamos reconstruir la hora desde los milisegundos para evitar el offset de 1899
                        // Excel base: 1899-12-30T00:00:00Z
                        const base = new Date(Date.UTC(1899, 11, 30));
                        const diffMs = v.getTime() - base.getTime();
                        const totalMinutes = Math.round(diffMs / (60 * 1000));
                        const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
                        const m = (totalMinutes % 60).toString().padStart(2, '0');
                        rowData.push(`${h}:${m}`);
                        return;
                    }

                    // Si es un objeto de ExcelJS (fórmula, rich text, etc), intentamos sacar el texto
                    if (typeof v === 'object') {
                        if ('result' in v) { rowData.push(v.result); return }
                        if (v.richText) { rowData.push(v.richText.map(r => r.text ?? '').join('')); return }
                        rowData.push(v) 
                        return
                    }
                    
                    rowData.push(v)
                })
                jsonData.push(rowData)
            })

            const processed = parseSimpleSchedule(jsonData)
            setPreviewData(processed)
            setErrors(processed.length === 0 ? [{ row: 'General', errors: ['No se encontraron partidos válidos. Revisa el formato: Fecha, Hora, Cancha, Local, Visitante.'] }] : [])
        } catch (error) {
            console.error("Error parsing file", error)
            setErrors([{ row: 'General', errors: ['Error al leer el archivo. Asegúrate que sea un Excel válido.'] }])
        } finally {
            setIsProcessing(false)
        }
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
        <Modal isOpen={isOpen} onClose={handleClose} title={`Cargar Fixture - ${tournament?.name}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sube el Fixture (Excel)</p>
                            <p style={{ fontSize: '0.875rem' }}>Formato: Fecha, Hora, Cancha, Local, Visitante</p>
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

                {isProcessing && <p>Procesando archivo...</p>}

                {file && !isProcessing && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)' }}>
                            <FileSpreadsheet size={24} style={{ color: 'var(--success)' }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600 }}>{file.name}</p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {previewData.length} partidos encontrados
                                </p>
                            </div>
                            <button onClick={() => { setFile(null); setPreviewData([]); setErrors([]) }} className="btn-icon">
                                <CircleX size={24} />
                            </button>
                        </div>

                        {errors.length > 0 && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <TriangleAlert size={18} />
                                    Errores Detectados
                                </h4>
                                <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    {errors.map((err, i) => (
                                        <li key={i}>{err.errors.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <h4 style={{ marginBottom: '1rem' }}>Vista Previa (Primeros 5)</h4>
                        <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Fecha/Hora</th>
                                        <th>Cancha</th>
                                        <th>Equipos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 5).map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.date} {p.time}</td>
                                            <td>{p.field}</td>
                                            <td>{p.homeTeam} vs {p.awayTeam}</td>
                                        </tr>
                                    ))}
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
                                Confirmar Importación
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ScheduleExcelUploader
