import { useState, useEffect } from 'react';
import { useGym } from '../context/GymContext';

export default function UserForm({ onSubmit, initialData = null, onCancel }) {
    const { promotions, prices, renewSubscription } = useGym();
    const [formData, setFormData] = useState({
        name: '',
        last_name: '',
        phone: '',
        emergencyContact: '',
        subscriptionType: 'monthly',
        promotion_id: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                last_name: initialData.last_name || '',
                promotion_id: initialData.promotion_id || ''
            });
        }
    }, [initialData]);

    const isAlreadyExpired = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiration = new Date(dateString);
        expiration.setHours(0,0,0,0);
        return expiration < today;
    };
    
    const isExpired = initialData && isAlreadyExpired(initialData.expirationDate);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRenew = async (e) => {
        e.preventDefault();
        if (window.confirm('¿Estás seguro de que deseas renovar esta suscripción empezando desde hoy?')) {
            const res = await renewSubscription(initialData.id, formData.subscriptionType);
            if (res.success) {
                alert('¡Suscripción renovada exitosamente!');
                onCancel();
            } else {
                alert('Hubo un error al renovar: ' + res.message);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Convert empty string promotion_id to null for DB cleanly
        const submitData = {
            ...formData,
            promotion_id: formData.promotion_id === '' ? null : formData.promotion_id
        };
        onSubmit(submitData);
    };

    return (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
                {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej. Juan"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Apellido(s)</label>
                        <input
                            type="text"
                            name="last_name"
                            required
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Ej. Pérez"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Teléfono</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Ej. 555-1234"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Contacto de Emergencia</label>
                        <input
                            type="text"
                            name="emergencyContact"
                            required
                            value={formData.emergencyContact}
                            onChange={handleChange}
                            placeholder="Nombre y Teléfono"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Suscripción</label>
                        <select
                            name="subscriptionType"
                            value={formData.subscriptionType}
                            onChange={handleChange}
                        >
                            <option value="quincenal">Quincenal</option>
                            <option value="monthly">Mensual</option>
                            <option value="student">Estudiantil</option>
                            <option value="annual">Anual</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Promoción (Opcional)</label>
                        <select
                            name="promotion_id"
                            value={formData.promotion_id}
                            onChange={handleChange}
                        >
                            <option value="">Ninguna</option>
                            {promotions.map((promo) => (
                                <option key={promo.id} value={promo.id}>
                                    {promo.name} (-{promo.discount_percentage}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* VISUAL DE ESTADO DE PAGOS */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                }}>
                    <h4 style={{ marginBottom: '0.8rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Resumen de Suscripción</h4>
                    
                    {(() => {
                        const typePrices = {
                            'monthly': prices.monthly,
                            'annual': prices.annual,
                            'quincenal': prices.quincenal,
                            'student': prices.student
                        };
                        const basePrice = typePrices[formData.subscriptionType] || 0;
                        const selectedPromo = formData.promotion_id ? promotions.find(p => p.id === Number(formData.promotion_id) || p.id === formData.promotion_id) : null;
                        const discountPercent = selectedPromo ? Number(selectedPromo.discount_percentage) : 0;
                        const discountAmount = basePrice * (discountPercent / 100);
                        const finalPrice = basePrice - discountAmount;

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Membresía {formData.subscriptionType === 'monthly' ? 'Mensual' : 'Anual'}:</span>
                                    <span>${basePrice.toFixed(2)}</span>
                                </div>
                                {discountPercent > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                                        <span>Descuento aplicado (-{discountPercent}%):</span>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.2rem', fontWeight: 'bold' }}>
                                    <span style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Total a pagar:</span>
                                    <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>${finalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    {isExpired && (
                        <button type="button" onClick={handleRenew} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold' }}>
                            Renovar
                        </button>
                    )}
                    <button type="button" onClick={onCancel} className="btn-danger" style={{ border: 'none', color: 'var(--text-secondary)' }}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                        {initialData ? 'Guardar Cambios' : 'Registrar Usuario'}
                    </button>
                </div>
            </form>
        </div>
    );
}
