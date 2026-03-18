import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ScheduleImportErrors = ({ errors, warnings }) => {
    if ((!errors || errors.length === 0) && (!warnings || warnings.length === 0)) return null;

    return (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {(errors && errors.length > 0) && (
                <>
                    <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={18} />
                        Errores Detectados ({errors.length})
                    </h4>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        {errors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                        {errors.length > 5 && <li>... y {errors.length - 5} errores más.</li>}
                    </ul>
                </>
            )}
            
            {(warnings && warnings.length > 0) && (
                <>
                    <h4 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={18} />
                        Advertencias ({warnings.length})
                    </h4>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                        {warnings.slice(0, 5).map((warn, i) => (
                            <li key={i}>{warn}</li>
                        ))}
                        {warnings.length > 5 && <li>... y {warnings.length - 5} advertencias más.</li>}
                    </ul>
                </>
            )}
        </div>
    );
};

export default ScheduleImportErrors;
