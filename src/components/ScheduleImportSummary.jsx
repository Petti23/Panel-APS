import React from 'react';
import './Pages.css';

const ScheduleImportSummary = ({ estadisticas, tituloGeneral }) => {
    if (!estadisticas) return null;

    return (
        <div className="import-summary">
            <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>{tituloGeneral || 'Organización sin título'}</p>
            <div className="import-stats">
                <div className="import-stat">
                    <span className="import-stat-label">Categorías</span>
                    <span className="import-stat-value">{estadisticas.categoriasDetectadas}</span>
                </div>
                <div className="import-stat">
                    <span className="import-stat-label">Partidos Válidos</span>
                    <span className="import-stat-value" style={{ color: 'var(--success)' }}>{estadisticas.partidosValidos}</span>
                </div>
                <div className="import-stat">
                    <span className="import-stat-label">Sin Actividad</span>
                    <span className="import-stat-value">{estadisticas.bloquesSinActividad}</span>
                </div>
                <div className="import-stat">
                    <span className="import-stat-label">Errores</span>
                    <span className="import-stat-value" style={{ color: estadisticas.errores > 0 ? 'var(--danger)' : 'inherit' }}>{estadisticas.errores}</span>
                </div>
            </div>
        </div>
    );
};

export default ScheduleImportSummary;
