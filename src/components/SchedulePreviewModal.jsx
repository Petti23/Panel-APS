import React from 'react';
import Modal from './Modal';
import { FileSpreadsheet, XCircle, CheckCircle } from 'lucide-react';
import ScheduleImportSummary from './ScheduleImportSummary';
import ScheduleImportErrors from './ScheduleImportErrors';

const SchedulePreviewModal = ({ isOpen, onClose, fileName, previewData, onConfirm }) => {
    if (!isOpen || !previewData) return null;

    const { categorias, estadisticas, tituloGeneral } = previewData;

    const allErrors = [];
    const allWarnings = [];

    categorias.forEach(cat => {
        if (cat.erroresFila && cat.erroresFila.length > 0) {
            cat.erroresFila.forEach(err => allWarnings.push(`Cat: ${cat.categoriaRaw}: ${err.errors.join(', ')}`));
        }
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Previsualizar Programación - ${fileName}`}>
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ScheduleImportSummary estadisticas={estadisticas} tituloGeneral={tituloGeneral} />
                <ScheduleImportErrors errors={allErrors} warnings={allWarnings} />

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {categorias.map((cat, idx) => (
                        <div key={idx} style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="category-badge" style={{ fontSize: '0.85rem' }}>{cat.categoriaRaw}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    {cat.estado === 'con_partidos' ? `${cat.partidos.length} partidos` : cat.estado}
                                </span>
                            </h4>
                            
                            {cat.estado === 'con_partidos' && cat.partidos.length > 0 && (
                                <div className="table-container">
                                    <table className="data-table" style={{ fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Hora</th>
                                                <th>Local</th>
                                                <th>Vs</th>
                                                <th>Visitante</th>
                                                <th>Diamante</th>
                                                <th>Árbitros</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cat.partidos.map((p, pIdx) => (
                                                <tr key={pIdx}>
                                                    <td>{p.fechaTexto}</td>
                                                    <td>{p.hora}</td>
                                                    <td>{p.local}</td>
                                                    <td>{p.vs}</td>
                                                    <td>{p.visitante}</td>
                                                    <td>{p.diamante}</td>
                                                    <td>{p.arbitros}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {cat.estado === 'sin_actividad' && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{cat.mensaje}</p>
                            )}

                            {cat.estado === 'informativo' && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{cat.mensaje}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="form-actions">
                    <button onClick={onClose} className="btn btn-outline">Cancelar</button>
                    <button onClick={onConfirm} className="btn btn-primary" disabled={estadisticas.partidosValidos === 0}>
                        Confirmar Importación ({estadisticas.partidosValidos} partidos)
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SchedulePreviewModal;
