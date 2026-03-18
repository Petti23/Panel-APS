import React from 'react';

const ScheduleImportSummary = ({ estadisticas, tituloGeneral }) => {
    if (!estadisticas) return null;

    return (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{tituloGeneral || "Organización sin título"}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Categorías</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{estadisticas.categoriasDetectadas}</p>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Partidos Válidos</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)', margin: 0 }}>{estadisticas.partidosValidos}</p>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Sin Actividad</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{estadisticas.bloquesSinActividad}</p>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Errores</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600, color: estadisticas.errores > 0 ? 'var(--danger)' : 'inherit', margin: 0 }}>{estadisticas.errores}</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleImportSummary;
