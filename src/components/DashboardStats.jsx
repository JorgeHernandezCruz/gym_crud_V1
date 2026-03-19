import { useState, useMemo } from 'react';
import { useGym } from '../context/GymContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardStats() {
    const { users, visits, prices, products, sales, updatePrices, promotions, addPromotion, deletePromotion } = useGym();
    const [monthlyPrice, setMonthlyPrice] = useState(prices?.monthly || 450);
    const [annualPrice, setAnnualPrice] = useState(prices?.annual || 4500);
    const [quincenalPrice, setQuincenalPrice] = useState(prices?.quincenal || 250);
    const [studentPrice, setStudentPrice] = useState(prices?.student || 400);
    const [isEditing, setIsEditing] = useState(false);
    
    // Formulario de nuevas promociones
    const [newPromoName, setNewPromoName] = useState('');
    const [newPromoDiscount, setNewPromoDiscount] = useState('');
    const [newPromoValidFrom, setNewPromoValidFrom] = useState('');
    const [newPromoValidUntil, setNewPromoValidUntil] = useState('');

    // -- Reportes de Ventas --
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportSelectedProducts, setReportSelectedProducts] = useState([]);
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

    // -- Filtro Mensual Efectivo vs Transferencia --
    const [paymentMethodMonth, setPaymentMethodMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    // -- Suscripciones y Visitas --
    const activeUsers = users.length;
    const visitsToday = visits.filter(v => {
        const visitDate = new Date(v.timestamp).toDateString();
        return visitDate === new Date().toDateString();
    }).length;



    // -- Productos y Ventas --
    const totalProductsInStock = products.reduce((acc, p) => acc + Number(p.stock), 0);
    const totalProductsSold = sales.reduce((acc, s) => acc + Number(s.quantity), 0);
    const totalRevenueFromSales = sales.reduce((acc, s) => acc + parseFloat(s.total), 0);

    // -- Ventas por Método de Pago en el Mes Seleccionado --
    const { monthlyCash, monthlyTransfer } = useMemo(() => {
        let cash = 0;
        let transfer = 0;
        sales.forEach(s => {
            const dateStr = s.timestamp.replace ? s.timestamp.replace(' ', 'T') : s.timestamp;
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthKey === paymentMethodMonth) {
                const amount = parseFloat(s.total) || 0;
                if (s.paymentType === 'transferencia') transfer += amount;
                else cash += amount; // default: efectivo
            }
        });
        return { monthlyCash: cash, monthlyTransfer: transfer };
    }, [sales, paymentMethodMonth]);

    // -- Ganancias Mensuales (Suscripciones + Ventas) --
    // Convertir las ventas a un objeto organizado por "YYYY-MM"
    const salesByMonth = sales.reduce((acc, sale) => {
        const date = new Date(sale.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + parseFloat(sale.total);
        return acc;
    }, {});

    // Convertir las suscripciones a un objeto organizado por "YYYY-MM" de creación
    const subscriptionsByMonth = users.reduce((acc, user) => {
        // Fallback robusto en caso de que falte createdAt
        const dateString = user.createdAt || new Date().toISOString(); 
        const date = new Date(dateString);
        
        if (!isNaN(date)) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            let subValue = prices.monthly;
            if (user.subscriptionType === 'annual') subValue = prices.annual;
            if (user.subscriptionType === 'quincenal') subValue = prices.quincenal;
            if (user.subscriptionType === 'student') subValue = prices.student;

            // Aplicar descuento si tiene
            const discountPercent = user.discount_percentage ? Number(user.discount_percentage) : 0;
            const discountedValue = subValue - (subValue * (discountPercent / 100));

            acc[monthKey] = (acc[monthKey] || 0) + discountedValue;
        }
        return acc;
    }, {});

    // Estimar el ingreso recurrente mensual fijo de suscripciones actuales globales
    const monthlySubscriptionsRevenue = users.reduce((acc, user) => {
        let baseValue = prices.monthly;
        if (user.subscriptionType === 'annual') baseValue = prices.annual / 12;
        if (user.subscriptionType === 'quincenal') baseValue = prices.quincenal * 2;
        if (user.subscriptionType === 'student') baseValue = prices.student;

        const discountPercent = user.discount_percentage ? Number(user.discount_percentage) : 0;
        const discountedValue = baseValue - (baseValue * (discountPercent / 100));
        return acc + discountedValue;
    }, 0);
    
    // Obtener los últimos 6 meses formateados ("2026-03" -> "Mar 2026")
    const getRecentMonths = () => {
        let months = [];
        let d = new Date();
        for(let i=0; i<6; i++) {
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const mName = d.toLocaleString('es-ES', { month: 'short' });
            months.unshift({ key: mKey, label: `${mName} ${d.getFullYear()}`.toUpperCase() });
            d.setMonth(d.getMonth() - 1);
        }
        return months;
    };
    const recentMonths = getRecentMonths();

    const handleUpdatePrices = (e) => {
        e.preventDefault();
        updatePrices({
            monthly: Number(monthlyPrice),
            annual: Number(annualPrice),
            quincenal: Number(quincenalPrice),
            student: Number(studentPrice)
        });
        setIsEditing(false);
    };

    const handleAddPromotion = async (e) => {
        e.preventDefault();
        if (newPromoName && newPromoDiscount) {
            const result = await addPromotion({
                name: newPromoName,
                discount_percentage: Number(newPromoDiscount),
                valid_from: newPromoValidFrom || null,
                valid_until: newPromoValidUntil || null
            });
            
            if (result && result.success) {
                alert('Promoción creada exitosamente.');
                setNewPromoName('');
                setNewPromoDiscount('');
                setNewPromoValidFrom('');
                setNewPromoValidUntil('');
            } else {
                alert('Error al crear promoción: ' + (result?.message || 'Error desconocido'));
            }
        }
    };

    const handleDeletePromotion = (id) => {
        if (window.confirm("¿Estás seguro de eliminar esta promoción? Esto la quitará de los usuarios que la tengan activa.")) {
            deletePromotion(id);
        }
    };

    // --- LOGICA DE REPORTES ---
    const salesReportData = useMemo(() => {
        // Filtrar por fechas si existen
        let filtered = sales;
        if (reportStartDate) {
            const startStr = new Date(reportStartDate);
            startStr.setHours(0,0,0,0);
            filtered = filtered.filter(s => new Date(s.timestamp) >= startStr);
        }
        if (reportEndDate) {
            const endStr = new Date(reportEndDate);
            endStr.setHours(23,59,59,999);
            filtered = filtered.filter(s => new Date(s.timestamp) <= endStr);
        }
        if (reportSelectedProducts.length > 0) {
            filtered = filtered.filter(s => reportSelectedProducts.includes(s.productName));
        }

        // Agrupar por producto
        const grouped = filtered.reduce((acc, sale) => {
            if (!acc[sale.productName]) {
                acc[sale.productName] = { name: sale.productName, cantidad: 0, ganancias: 0 };
            }
            acc[sale.productName].cantidad += Number(sale.quantity);
            acc[sale.productName].ganancias += parseFloat(sale.total);
            return acc;
        }, {});

        // Convertir a arreglo y ordenar por cantidad descendente
        return Object.values(grouped).sort((a, b) => b.cantidad - a.cantidad);
    }, [sales, reportStartDate, reportEndDate, reportSelectedProducts]);

    const handleDownloadCSV = () => {
        let filtered = sales;
        if (reportStartDate) {
            const startStr = new Date(reportStartDate);
            startStr.setHours(0,0,0,0);
            filtered = filtered.filter(s => new Date(s.timestamp) >= startStr);
        }
        if (reportEndDate) {
            const endStr = new Date(reportEndDate);
            endStr.setHours(23,59,59,999);
            filtered = filtered.filter(s => new Date(s.timestamp) <= endStr);
        }
        if (reportSelectedProducts.length > 0) {
            filtered = filtered.filter(s => reportSelectedProducts.includes(s.productName));
        }

        if (filtered.length === 0) {
            alert('No hay datos en el rango seleccionado para exportar.');
            return;
        }

        const headers = ['Fecha', 'Producto', 'Cantidad Vendida', 'Ganancias ($)'];
        const csvRows = [
            headers.join(','), // Header row
            ...filtered.map(row => {
                const dateStr = typeof row.timestamp === 'string' ? row.timestamp : new Date(row.timestamp).toLocaleString();
                return `"${dateStr}","${row.productName}",${row.quantity},${parseFloat(row.total).toFixed(2)}`;
            })
        ];
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n'); // \uFEFF for Excel UTF-8 BOM
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Reporte_Ventas_${reportStartDate || 'inicio'}_a_${reportEndDate || 'fin'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ color: 'var(--text-primary)' }}>Dashboard General</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Vista general de ingresos, membresías y ventas</p>
            </div>

            {/* SECCIÓN 1: Suscripciones y Clientes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Usuarios Activos</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--accent)' }}>{activeUsers}</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Visitas Hoy</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>{visitsToday}</p>
                </div>
                <div className="card">
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ingreso Recurrente (Membresías)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        ${monthlySubscriptionsRevenue.toFixed(0)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ mes</span>
                    </p>
                </div>
            </div>

            {/* SECCIÓN 2: Métricas de Ventas y Productos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Productos Vendidos (Total)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>{totalProductsSold}</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Ganancias por Ventas (Total)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>${totalRevenueFromSales.toFixed(2)}</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Artículos en Stock (Total)</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#6366f1' }}>{totalProductsInStock}</p>
                </div>
            </div>

            {/* SECCIÓN 2.5: Ventas por Método de Pago */}
            <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Ventas por Método de Pago</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Filtro mensual de efectivo y transferencia</p>
                    </div>
                    <div>
                        <input 
                            type="month" 
                            value={paymentMethodMonth}
                            onChange={(e) => setPaymentMethodMonth(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white', fontWeight: 'bold' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💵</div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total en Efectivo</h4>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>${monthlyCash.toFixed(2)}</p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Total en Transferencia</h4>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>${monthlyTransfer.toFixed(2)}</p>
                    </div>
                </div>
            </div>



            {/* SECCIÓN 3: Desglose Mensual (Últimos 6 meses) */}
            <div className="card fade-in">
                <h3 style={{ marginBottom: '1.5rem' }}>Ganancias Combinadas (Últimos 6 Meses)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    {recentMonths.map((m) => {
                        const salesEarnings = salesByMonth[m.key] || 0;
                        const subsEarnings = subscriptionsByMonth[m.key] || 0;
                        const totalReal = subsEarnings + salesEarnings;
                        
                        return (
                            <div key={m.key} style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{m.label}</span>
                                <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)' }}>${totalReal.toFixed(0)}</span>
                                
                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membresías: ${subsEarnings.toFixed(0)}</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#10b981' }}>Ventas: ${salesEarnings.toFixed(0)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 4: Configuración */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Configuración de Precios Fijos</h3>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                            Editar Precios
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdatePrices} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quincenal</label>
                            <input type="number" value={quincenalPrice} onChange={e => setQuincenalPrice(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mensualidad</label>
                            <input type="number" value={monthlyPrice} onChange={e => setMonthlyPrice(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estudiantil</label>
                            <input type="number" value={studentPrice} onChange={e => setStudentPrice(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Anualidad</label>
                            <input type="number" value={annualPrice} onChange={e => setAnnualPrice(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Guardar</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="btn-danger" style={{ width: '100%' }}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Quincena Base</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${prices?.quincenal || 250}</span>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Mensualidad Base</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${prices?.monthly || 450}</span>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Estudiantil Base</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${prices?.student || 400}</span>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                            <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Anualidad Base</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${prices?.annual || 4500}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* SECCIÓN 5: Promociones */}
            <div className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Configuración de Promociones</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Crear Promoción */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Agregar Nueva Promoción</h4>
                        <form onSubmit={handleAddPromotion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nombre de la Promoción</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Estudiante, Familiar..." 
                                    value={newPromoName}
                                    onChange={(e) => setNewPromoName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Descuento (%)</label>
                                <input 
                                    type="number" 
                                    placeholder="Ej: 15" 
                                    min="1" max="100"
                                    value={newPromoDiscount}
                                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Inicio (Opcional)</label>
                                    <input 
                                        type="date" 
                                        value={newPromoValidFrom}
                                        onChange={(e) => setNewPromoValidFrom(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Fin (Opcional)</label>
                                    <input 
                                        type="date" 
                                        value={newPromoValidUntil}
                                        onChange={(e) => setNewPromoValidUntil(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                            <small style={{ color: 'var(--text-muted)' }}>Déjalo en blanco si no aplica.</small>
                            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Crear Promoción</button>
                        </form>
                    </div>

                    {/* Promociones Activas */}
                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Promociones Disponibles</h4>
                        {promotions.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No hay promociones configuradas actualmente.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {promotions.map(promo => {
                                    const rawValidFrom = promo.valid_from;
                                    const rawValidUntil = promo.valid_until;
                                    
                                    const today = new Date();
                                    today.setHours(0,0,0,0);
                                    
                                    let isStarted = true;
                                    if (rawValidFrom) {
                                        isStarted = new Date(rawValidFrom) <= today;
                                    }
                                    
                                    let isValid = true;
                                    if (rawValidUntil) {
                                        isValid = new Date(rawValidUntil) >= today;
                                    }
                                    
                                    const isActive = isStarted && isValid;
                                    
                                    return (
                                        <div key={promo.id} style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                            padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)',
                                            borderLeft: isActive ? '4px solid var(--success)' : (isValid ? '4px solid #f59e0b' : '4px solid var(--danger)')
                                        }}>
                                            <div>
                                                <strong style={{ display: 'block', color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>{promo.name}</strong>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>{promo.discount_percentage}% de descuento</span>
                                                {(rawValidFrom || rawValidUntil) && (
                                                    <span style={{ fontSize: '0.8rem', color: isActive ? 'var(--text-secondary)' : (isValid ? '#f59e0b' : 'var(--danger)') }}>
                                                        {rawValidFrom ? `Desde: ${new Date(rawValidFrom).toLocaleDateString()}` : 'Siempre'} 
                                                        {rawValidUntil ? ` hasta: ${new Date(rawValidUntil).toLocaleDateString()}` : ' en adelante'}
                                                        {!isActive && (
                                                            <strong> ({isValid ? 'Próximamente' : 'Expirada'})</strong>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => handleDeletePromotion(promo.id)}
                                                className="btn-danger" 
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 6: Reportes y Gráficas de Ventas */}
            <div className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3>Reporte de Ventas por Producto</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Visualiza los productos más populares y descarga los datos</p>
                    </div>
                    <button onClick={handleDownloadCSV} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        Descargar CSV
                    </button>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desde la fecha:</label>
                        <input 
                            type="date" 
                            value={reportStartDate} 
                            onChange={(e) => setReportStartDate(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white' }} 
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hasta la fecha:</label>
                        <input 
                            type="date" 
                            value={reportEndDate} 
                            onChange={(e) => setReportEndDate(e.target.value)} 
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white' }} 
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Filtrar por Producto:</label>
                        <div 
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white', minWidth: '220px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {reportSelectedProducts.length === 0 ? '-- Todos los productos --' : `${reportSelectedProducts.length} producto(s) sel.`}
                            </span>
                            <span style={{ fontSize: '0.7rem' }}>{isProductDropdownOpen ? '▲' : '▼'}</span>
                        </div>
                        
                        {isProductDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-color)', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 'var(--radius)', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                                {products.map(p => (
                                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'var(--bg-card)' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={reportSelectedProducts.includes(p.name)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setReportSelectedProducts([...reportSelectedProducts, p.name]);
                                                } else {
                                                    setReportSelectedProducts(reportSelectedProducts.filter(name => name !== p.name));
                                                }
                                            }}
                                            style={{ marginRight: '0.5rem', width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: 'white' }}>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ paddingBottom: '0.2rem' }}>
                        <button onClick={() => { setReportStartDate(''); setReportEndDate(''); setReportSelectedProducts([]); }} className="btn-danger" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)' }}>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Contenedor del Gráfico */}
                {salesReportData.length > 0 ? (
                    <div style={{ width: '100%', height: 400, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={salesReportData.slice(0, 15)} // Limitar a top 15 para legibilidad
                                margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="var(--text-secondary)" 
                                    tick={{ fill: 'var(--text-secondary)' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(0,0,0,0.1)', color: 'white' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar yAxisId="left" dataKey="cantidad" name="Cantidad Vendida" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar yAxisId="right" dataKey="ganancias" name="Ganancias ($)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                        No hay ventas registradas en las fechas indicadas.
                    </p>
                )}
            </div>
        </div>
    );
}
