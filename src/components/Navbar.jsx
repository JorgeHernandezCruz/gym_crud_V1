import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
    const { user, logout } = useAuth();

    const tabs = [
        { id: 'users', label: 'Usuarios', roles: ['admin', 'employee'] },
        { id: 'checkin', label: 'Check-in', roles: ['admin', 'employee'] },
        { id: 'visitas', label: 'Visitas', roles: ['admin', 'employee'] },
        { id: 'history', label: 'Historial', roles: ['admin', 'employee'] },
        { id: 'ventas', label: 'Ventas', roles: ['admin', 'employee'] },
        { id: 'stock', label: 'Stock', roles: ['admin', 'employee'] },
        { id: 'employees', label: 'Trabajadores', roles: ['admin'] },
        { id: 'dashboard', label: 'Dashboard', roles: ['admin'] },
    ];

    return (
        <nav style={{
            background: 'var(--bg-card)',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <img src="/logo_blanco_TBG.png" alt="Logo" style={{ height: '45px', marginRight: '1rem', objectFit: 'contain' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {tabs.filter(tab => tab.roles.includes(user.role)).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius)',
                                backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Hola, {user.username}
                </span>
                <button
                    onClick={logout}
                    className="btn-danger"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
}
