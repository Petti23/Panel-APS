import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { readWorkbook } from '../services/excel/readWorkbook';
import { sheetToScheduleModel } from '../adapters/schedule/sheetToScheduleModel';
import { scheduleToAppModel } from '../adapters/schedule/scheduleToAppModel';
import SchedulePreviewModal from './SchedulePreviewModal';

const ExcelScheduleUploader = ({ onUpload }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setFileName(file.name);
        setIsProcessing(true);

        try {
            const workbook = await readWorkbook(file);
            const parsedModel = sheetToScheduleModel(workbook);
            setPreviewData(parsedModel);
        } catch (err) {
            console.error(err);
            alert("Error procesando el archivo Excel.");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirm = () => {
        if (!previewData) return;
        const appModel = scheduleToAppModel(previewData);
        if (onUpload) {
            onUpload(appModel);
        }
        setPreviewData(null);
    };

    const handleClose = () => {
        setPreviewData(null);
    };

    return (
        <div>
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
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
                <Upload size={48} />
                <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Haz clic para subir programación</p>
                    <p style={{ fontSize: '0.875rem' }}>Formato esperado: Planilla de programación deportiva APS</p>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                />
            </div>

            {isProcessing && <p style={{ marginTop: '1rem', textAlign: 'center' }}>Procesando archivo complexo, aguarde...</p>}

            <SchedulePreviewModal
                isOpen={!!previewData}
                onClose={handleClose}
                fileName={fileName}
                previewData={previewData}
                onConfirm={handleConfirm}
            />
        </div>
    );
};

export default ExcelScheduleUploader;
