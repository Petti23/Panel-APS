import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { readWorkbook } from '../services/excel/readWorkbook';
import { sheetToScheduleModel } from '../adapters/schedule/sheetToScheduleModel';
import { scheduleToAppModel } from '../adapters/schedule/scheduleToAppModel';
import SchedulePreviewModal from './SchedulePreviewModal';
import './Pages.css';

const ExcelScheduleUploader = ({ onUpload }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    const processFile = async (file) => {
        if (!file) return;
        setFileName(file.name);
        setIsProcessing(true);
        try {
            const workbook = await readWorkbook(file);
            const parsedModel = sheetToScheduleModel(workbook);
            setPreviewData(parsedModel);
        } catch (err) {
            console.error(err);
            alert('Error procesando el archivo Excel.');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e) => processFile(e.target.files[0]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!isProcessing) setIsDragging(true);
    }, [isProcessing]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (isProcessing) return;
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [isProcessing]);

    const handleConfirm = () => {
        if (!previewData) return;
        const appModel = scheduleToAppModel(previewData);
        if (onUpload) onUpload(appModel);
        setPreviewData(null);
    };

    return (
        <div>
            <div
                className={`excel-drop-zone${isProcessing ? ' processing' : ''}${isDragging ? ' dragging' : ''}`}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="excel-drop-zone-icon">
                    {isProcessing ? <Upload size={30} /> : <FileSpreadsheet size={30} />}
                </div>
                <div>
                    <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
                        {isProcessing ? 'Procesando archivo, aguarde...' : isDragging ? 'Soltá el archivo aquí' : 'Arrastrá o hacé clic para subir'}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isProcessing ? 'Esto puede demorar unos segundos...' : 'Formatos soportados: .xlsx, .xls'}
                    </p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                />
            </div>

            <SchedulePreviewModal
                isOpen={!!previewData}
                onClose={() => setPreviewData(null)}
                fileName={fileName}
                previewData={previewData}
                onConfirm={handleConfirm}
            />
        </div>
    );
};

export default ExcelScheduleUploader;
