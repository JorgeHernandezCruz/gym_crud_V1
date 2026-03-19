import { useState } from 'react';
import { useGym } from '../context/GymContext';
import UserForm from './UserForm';

export default function UserList() {
    const { users, deleteUser, addUser, updateUser } = useGym();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = (data) => {
        addUser(data);
        setIsFormOpen(false);
    };

    const handleEdit = (data) => {
        updateUser(editingUser.id, data);
        setEditingUser(null);
        setIsFormOpen(false);
    };

    const startEdit = (user) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            deleteUser(id);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.id.includes(searchTerm) ||
        (user.phone && user.phone.includes(searchTerm))
    );
    const isExpiringSoon = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiration = new Date(dateString);
        expiration.setHours(0,0,0,0);
        const diffTime = expiration - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 5;
    };
    
    const isAlreadyExpired = (dateString) => {
        if (!dateString) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiration = new Date(dateString);
        expiration.setHours(0,0,0,0);
        return expiration < today;
    };



    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)' }}>Usuarios</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión de miembros del gimnasio</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
                >
                    + Nuevo Usuario
                </button>
            </div>



            {isFormOpen && (
                <UserForm
                    onSubmit={editingUser ? handleEdit : handleAdd}
                    initialData={editingUser}
                    onCancel={() => { setIsFormOpen(false); setEditingUser(null); }}
                />
            )}

            <div className="card">
                <input
                    type="text"
                    placeholder="Buscar por nombre, ID o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: '1.5rem', maxWidth: '300px' }}
                />

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: '0.9rem' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>ID</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Nombre</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Apellido</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Suscripción</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Fechas</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Promoción</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Contacto</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{user.id}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{user.name}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{user.last_name || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {(() => {
                                                const map = {
                                                    'quincenal': { label: 'Quincenal', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
                                                    'monthly': { label: 'Mensual', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
                                                    'student': { label: 'Estudiantil', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
                                                    'annual': { label: 'Anual', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' }
                                                };
                                                const typeInfo = map[user.subscriptionType] || map['monthly'];

                                                return (
                                                    <span style={{
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: typeInfo.bg,
                                                        color: typeInfo.color,
                                                        display: 'inline-block',
                                                        fontWeight: '500'
                                                    }}>
                                                        {typeInfo.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                                                    <strong>Inicio:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div style={{ 
                                                    color: (isExpiringSoon(user.expirationDate) || isAlreadyExpired(user.expirationDate)) ? 'var(--danger)' : 'inherit',
                                                    fontWeight: (isExpiringSoon(user.expirationDate) || isAlreadyExpired(user.expirationDate)) ? 'bold' : 'normal'
                                                }}>
                                                    <strong>Vence:</strong> {user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A'}
                                                    {(isExpiringSoon(user.expirationDate) || isAlreadyExpired(user.expirationDate)) && <span style={{ marginLeft: '0.4rem' }}>⚠️</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {user.promotion_name ? (
                                                <div style={{
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: 'var(--radius)',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                                    fontSize: '0.85rem',
                                                    minWidth: '140px'
                                                }}>
                                                    <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                                                        ⭐ {user.promotion_name} (-{user.discount_percentage}%)
                                                    </div>
                                                    {user.promotion_valid_until ? (
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                                            Termina el: {new Date(user.promotion_valid_until).toLocaleDateString()}
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                            Sin caducidad
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>- No aplicada -</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            <div>{user.phone}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => startEdit(user)}
                                                style={{ background: 'none', color: 'var(--accent)', marginRight: '1rem' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="btn-danger"
                                                style={{ border: 'none' }}
                                            >
                                                Eliminar
                                            </button>
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
