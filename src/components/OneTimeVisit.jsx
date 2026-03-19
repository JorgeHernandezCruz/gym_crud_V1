import { useState } from 'react';
import { useGym } from '../context/GymContext';
import Swal from 'sweetalert2';

export default function OneTimeVisit() {
    const { registerOneTimeVisit } = useGym();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        note: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await registerOneTimeVisit(formData);
        if (result.success) {
            Swal.fire({
                title: '¡Visita Registrada!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2500,
                showConfirmButton: false
            });
            setFormData({ name: '', phone: '', note: '' });
        } else {
            Swal.fire({
                title: 'Error de Registro',
                text: result.message || 'Hubo un error al registrar la visita',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Registro de Visita (Sin Suscripción)</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Utilice este formulario para personas que pagan entrada por día o visitas ocasionales.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem' }}>Nombre del Visitante *</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej. Visitante Casual"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem' }}>Teléfono (Opcional)</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Ej. 555-0000"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem' }}>Nota / Cobro (Opcional)</label>
                        <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Ej. Pagó $50"
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        Registrar Entrada
                    </button>
                </form>
            </div>
        </div>
    );
}
