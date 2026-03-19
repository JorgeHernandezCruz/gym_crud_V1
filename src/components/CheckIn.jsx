import { useState } from 'react';
import { useGym } from '../context/GymContext';
import Swal from 'sweetalert2';

export default function CheckIn() {
    const { registerVisit } = useGym();
    const [userId, setUserId] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId.trim()) return;
        
        const result = await registerVisit(userId);

        if (result.success) {
            Swal.fire({
                title: '¡Acceso Concedido!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2500,
                showConfirmButton: false
            });
            setUserId('');
        } else {
            Swal.fire({
                title: 'Error de Check-in',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Registrar Visita</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Ingrese ID de usuario"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.2rem' }}
                        autoFocus
                    />
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                        Check-in
                    </button>
                </form>

                <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Ingrese el ID del usuario o el ID del trabajador (ej. T1234) para registrar su asistencia.
                </p>
            </div>
        </div>
    );
}
