import { useState } from 'react';
import { useGym } from '../context/GymContext';

export default function VisitHistory() {
    const { visits, users } = useGym();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');

    const filteredVisits = visits.filter(visit => {
        // match date
        if (searchDate) {
            const visitDate = new Date(visit.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (visitDate !== searchDate) return false;
        }

        // match text (name, id, phone)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const lowerName = visit.userName.toLowerCase();
            const lowerId = visit.userId.toLowerCase();

            // Find user to check phone
            const user = users.find(u => u.id === visit.userId);
            const phone = user ? user.phone : '';

            return (
                lowerName.includes(term) ||
                lowerId.includes(term) ||
                (phone && phone.includes(term))
            );
        }

        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ color: 'var(--text-primary)' }}>Historial de Visitas</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registro de accesos al gimnasio</p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ID o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: '1', minWidth: '250px' }}
                    />
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                    {(searchTerm || searchDate) && (
                        <button
                            className="btn-danger"
                            onClick={() => { setSearchTerm(''); setSearchDate(''); }}
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Fecha y Hora</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Usuario</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ID Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisits.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No se encontraron visitas registradas con estos criterios.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisits.map(visit => (
                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(visit.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{visit.userName}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            {visit.userId}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
