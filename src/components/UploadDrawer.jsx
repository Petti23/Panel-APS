import { useEffect, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, FileSpreadsheet, Upload } from 'lucide-react'
import { readWorkbook } from '../services/excel/readWorkbook'
import { sheetToScheduleModel } from '../adapters/schedule/sheetToScheduleModel'
import { scheduleToAppModel } from '../adapters/schedule/scheduleToAppModel'
import SchedulePreviewModal from './SchedulePreviewModal'
import './UploadDrawer.css'

const UploadDrawer = ({ isOpen, onClose, onUpload }) => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging]     = useState(false)
    const [previewData, setPreviewData]   = useState(null)
    const [fileName, setFileName]         = useState('')
    const fileInputRef = useRef(null)

    // close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    // reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false)
            setIsDragging(false)
        }
    }, [isOpen])

    const processFile = async (file) => {
        if (!file) return
        setFileName(file.name)
        setIsProcessing(true)
        try {
            const workbook    = await readWorkbook(file)
            const parsedModel = sheetToScheduleModel(workbook)
            setPreviewData(parsedModel)
        } catch (err) {
            console.error(err)
            alert('Error procesando el archivo Excel.')
        } finally {
            setIsProcessing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleFileChange = (e) => processFile(e.target.files[0])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        if (!isProcessing) setIsDragging(true)
    }, [isProcessing])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
        if (isProcessing) return
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }, [isProcessing])

    const handleConfirm = () => {
        if (!previewData) return
        const appModel = scheduleToAppModel(previewData)
        if (onUpload) onUpload(appModel)
        setPreviewData(null)
        onClose()
    }

    return createPortal(
        <>
            {/* Full-viewport backdrop — blurs everything */}
            <div
                className={`upload-drawer-backdrop${isOpen ? ' open' : ''}`}
                onClick={onClose}
            />

            <div className={`upload-drawer${isOpen ? ' open' : ''}`}>
                {/* Header */}
                <div className="upload-drawer-header">
                    <div className="upload-drawer-title">
                        <FileSpreadsheet size={18} />
                        Importar Programación
                    </div>
                    <button className="upload-drawer-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Drop zone */}
                <div className="upload-drawer-body">
                    <div
                        className={`upload-dz${isDragging ? ' dragging' : ''}${isProcessing ? ' processing' : ''}`}
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="upload-dz-icon">
                            {isProcessing ? <Upload size={26} /> : <FileSpreadsheet size={26} />}
                        </div>
                        <div className="upload-dz-text">
                            <strong>
                                {isProcessing
                                    ? 'Procesando archivo...'
                                    : isDragging
                                    ? 'Soltá el archivo aquí'
                                    : 'Arrastrá o hacé clic para subir'}
                            </strong>
                            <span>
                                {isProcessing
                                    ? 'Esto puede demorar unos segundos'
                                    : 'Formatos soportados: .xlsx · .xls'}
                            </span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>

            <SchedulePreviewModal
                isOpen={!!previewData}
                onClose={() => setPreviewData(null)}
                fileName={fileName}
                previewData={previewData}
                onConfirm={handleConfirm}
            />
        </>,
        document.body
    )
}

export default UploadDrawer
