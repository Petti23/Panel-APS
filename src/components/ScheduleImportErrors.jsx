import React from 'react';
import { TriangleAlert } from 'lucide-react';
import './Pages.css';

const ScheduleImportErrors = ({ errors, warnings }) => {
    if ((!errors || errors.length === 0) && (!warnings || warnings.length === 0)) return null;

    return (
        <div className="import-errors">
            {(errors && errors.length > 0) && (
                <>
                    <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                        <TriangleAlert size={16} />
                        Errores Detectados ({errors.length})
                    </h4>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: warnings?.length > 0 ? '1rem' : 0 }}>
                        {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                        {errors.length > 5 && <li>... y {errors.length - 5} errores más.</li>}
                    </ul>
                </>
            )}
            {(warnings && warnings.length > 0) && (
                <>
                    <h4 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
                        <TriangleAlert size={16} />
                        Advertencias ({warnings.length})
                    </h4>
                    <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem', margin: 0 }}>
                        {warnings.slice(0, 5).map((warn, i) => <li key={i}>{warn}</li>)}
                        {warnings.length > 5 && <li>... y {warnings.length - 5} advertencias más.</li>}
                    </ul>
                </>
            )}
        </div>
    );
};

export default ScheduleImportErrors;
