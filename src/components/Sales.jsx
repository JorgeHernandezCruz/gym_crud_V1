import { useState } from 'react';
import { useGym } from '../context/GymContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Sales() {
    const { products, sales, donations, addProduct, registerSale, registerDonation, loading } = useGym();
    const { user } = useAuth();
    
    // States for New Product
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('');
    const [newProductCapacity, setNewProductCapacity] = useState('');
    const [newProductUnit, setNewProductUnit] = useState('ml');

    // States for Registering Sale
    const [selectedProductId, setSelectedProductId] = useState('');
    const [saleQuantity, setSaleQuantity] = useState(1);
    const [salePaymentType, setSalePaymentType] = useState('efectivo');

    // States for Registering Donation
    const [donationProductId, setDonationProductId] = useState('');
    const [donationQuantity, setDonationQuantity] = useState(1);

    // Filters for CSV Export
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    // Calc totals
    const totalEfectivo = sales.filter(s => s.paymentType === 'efectivo' || !s.paymentType).reduce((sum, s) => sum + parseFloat(s.total), 0);
    const totalTransferencia = sales.filter(s => s.paymentType === 'transferencia').reduce((sum, s) => sum + parseFloat(s.total), 0);

    // Resumen diario, semanal, mensual
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let salesToday = 0;
    let salesWeek = 0;
    let salesMonth = 0;

    sales.forEach(sale => {
        let saleDate = sale.timestamp;
        if (typeof saleDate === 'string') {
            saleDate = new Date(saleDate.replace(' ', 'T'));
        } else if (!(saleDate instanceof Date)) {
             saleDate = new Date(saleDate);
        }
        if (isNaN(saleDate.getTime())) return;

        const total = parseFloat(sale.total) || 0;
        if (saleDate >= startOfDay) salesToday += total;
        if (saleDate >= startOfWeek) salesWeek += total;
        if (saleDate >= startOfMonth) salesMonth += total;
    });

    const handleExportSalesCSV = () => {
        let filtered = sales;
        if (exportStartDate) {
            const startStr = new Date(exportStartDate);
            startStr.setHours(0,0,0,0);
            filtered = filtered.filter(s => new Date(s.timestamp.replace(' ', 'T')) >= startStr);
        }
        if (exportEndDate) {
            const endStr = new Date(exportEndDate);
            endStr.setHours(23,59,59,999);
            filtered = filtered.filter(s => new Date(s.timestamp.replace(' ', 'T')) <= endStr);
        }

        if (filtered.length === 0) {
            alert('No hay ventas en el rango seleccionado.');
            return;
        }

        const headers = ['Fecha', 'Producto', 'Cantidad', 'Total ($)', 'Vendedor', 'Metodo de Pago'];
        const csvRows = [
            headers.join(','),
            ...filtered.map(row => 
                `"${row.timestamp}","${row.productName}",${row.quantity},${parseFloat(row.total).toFixed(2)},"${row.soldBy}","${row.paymentType || 'efectivo'}"`
            )
        ];
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Ventas_${exportStartDate || 'inicio'}_a_${exportEndDate || 'fin'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        const res = await addProduct({
            name: newProductName,
            price: Number(newProductPrice),
            stock: Number(newProductStock) || 0,
            capacity: newProductCapacity ? Number(newProductCapacity) : null,
            unit: newProductCapacity ? newProductUnit : null
        });
        if (res.success) {
            setShowNewProduct(false);
            setNewProductName('');
            setNewProductPrice('');
            setNewProductStock('');
            setNewProductCapacity('');
            setNewProductUnit('ml');
            Swal.fire({
                title: '¡Éxito!',
                text: 'Producto agregado con éxito',
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: res.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleRegisterSale = async (e) => {
        e.preventDefault();
        if (!selectedProductId) return;
        
        const product = products.find(p => String(p.id) === String(selectedProductId));
        if (!product) {
            Swal.fire({
                title: 'Error',
                text: 'Producto no encontrado',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (product.stock < Number(saleQuantity)) {
            Swal.fire({
                title: 'Stock Insuficiente',
                text: `Sólo quedan ${product.stock} unidades disponibles.`,
                icon: 'warning',
                confirmButtonColor: '#eab308'
            });
            return;
        }

        const res = await registerSale({
            productId: Number(selectedProductId),
            quantity: Number(saleQuantity),
            soldBy: user.username,
            paymentType: salePaymentType
        });

        if (res.success) {
            setSelectedProductId('');
            setSaleQuantity(1);
            setSalePaymentType('efectivo');
            Swal.fire({
                title: '¡Venta Registrada!',
                text: 'Venta exitosa',
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: res.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const handleRegisterDonation = async (e) => {
        e.preventDefault();
        if (!donationProductId) return;
        
        const product = products.find(p => String(p.id) === String(donationProductId));
        if (!product) {
            Swal.fire({
                title: 'Error',
                text: 'Producto no encontrado',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (product.stock < Number(donationQuantity)) {
            Swal.fire({
                title: 'Stock Insuficiente',
                text: `Sólo quedan ${product.stock} unidades disponibles.`,
                icon: 'warning',
                confirmButtonColor: '#eab308'
            });
            return;
        }

        const res = await registerDonation({
            productId: Number(donationProductId),
            quantity: Number(donationQuantity),
            donatedBy: user.username
        });

        if (res.success) {
            setDonationProductId('');
            setDonationQuantity(1);
            Swal.fire({
                title: '¡Donación Registrada!',
                text: 'El stock ha sido descontado correctamente.',
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2500,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: res.message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    if (loading) return <p>Cargando ventas...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)' }}>Punto de Venta</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registra las ventas de productos</p>
                </div>
                <button onClick={() => setShowNewProduct(!showNewProduct)} className="btn-primary">
                    {showNewProduct ? 'Cancelar' : 'Agregar producto nuevo'}
                </button>
            </div>

            {showNewProduct && (
                <div className="card fade-in">
                    <h3>Registrar Nuevo Producto</h3>
                    <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>Nombre del Producto</label>
                            <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} required />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 2 }}>
                                <label>Contenido</label>
                                <input type="number" min="0" value={newProductCapacity} onChange={e => setNewProductCapacity(e.target.value)} placeholder="(Opcional)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Unidad</label>
                                <select value={newProductUnit} onChange={e => setNewProductUnit(e.target.value)}>
                                    <option value="ml">ml</option>
                                    <option value="gr">gr</option>
                                    <option value="L">L</option>
                                    <option value="Kg">Kg</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label>Precio ($)</label>
                            <input type="number" min="0" step="0.01" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} required />
                        </div>
                        <div>
                            <label>Stock Inicial</label>
                            <input type="number" min="0" value={newProductStock} onChange={e => setNewProductStock(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1rem', height: '100%' }}>Guardar Producto</button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3>Registrar Venta</h3>
                <form onSubmit={handleRegisterSale} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label>Seleccionar Producto</label>
                        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required style={{ width: '100%' }}>
                            <option value="">-- Elige un producto --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                                    {p.name} {p.capacity && p.unit ? `(${p.capacity} ${p.unit})` : ''} - ${p.price} (Stock: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Cantidad</label>
                        <input type="number" min="1" value={saleQuantity} onChange={e => setSaleQuantity(e.target.value)} required style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label>Forma de Pago</label>
                        <select value={salePaymentType} onChange={e => setSalePaymentType(e.target.value)} required style={{ width: '100%' }}>
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="transferencia">📱 Transferencia</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-success" style={{ padding: '0.6rem 2rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                        Vender
                    </button>
                </form>
            </div>

            {/* Resumen de Ventas y Exportación */}
            <div className="card fade-in">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Resumen de Ganancias</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Ventas Hoy</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>${salesToday.toFixed(2)}</p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📆</div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Esta Semana</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>${salesWeek.toFixed(2)}</p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Este Mes</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>${salesMonth.toFixed(2)}</p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1.5rem' }}>
                     <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Exportar Ventas por Producto</h4>
                     <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desde la fecha:</label>
                            <input 
                                type="date" 
                                value={exportStartDate} 
                                onChange={(e) => setExportStartDate(e.target.value)} 
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hasta la fecha:</label>
                            <input 
                                type="date" 
                                value={exportEndDate} 
                                onChange={(e) => setExportEndDate(e.target.value)} 
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(0,0,0,0.2)', background: 'var(--bg-card)', color: 'white' }} 
                            />
                        </div>
                        <div style={{ paddingBottom: '0.2rem' }}>
                            <button onClick={handleExportSalesCSV} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }}>
                                Descargar CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3>Historial de Ventas Recientes</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Efectivo</span>
                            <span style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '1.2rem' }}>${totalEfectivo.toFixed(2)}</span>
                        </div>
                        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Transf.</span>
                            <span style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '1.2rem' }}>${totalTransferencia.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sales.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay ventas registradas.</p>
                    ) : (
                        sales.slice(0, 10).map(sale => (
                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold' }}>{sale.productName} (x{sale.quantity})</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span>Vendido por: {sale.soldBy}</span>
                                        <span>•</span>
                                        <span style={{ 
                                            color: sale.paymentType === 'transferencia' ? '#3b82f6' : '#22c55e', 
                                            fontWeight: 'bold',
                                            backgroundColor: sale.paymentType === 'transferencia' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '4px'
                                        }}>
                                            {sale.paymentType === 'transferencia' ? '📱 Transf.' : '💵 Efectivo'}
                                        </span>
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', color: 'var(--success)', fontWeight: 'bold' }}>${sale.total}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(sale.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="card">
                <h3 style={{ color: 'var(--accent)' }}>Registrar Donación</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Descuenta stock del inventario sin registrar ganancias.</p>
                <form onSubmit={handleRegisterDonation} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label>Seleccionar Producto</label>
                        <select value={donationProductId} onChange={e => setDonationProductId(e.target.value)} required>
                            <option value="">-- Elige un producto --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                                    {p.name} {p.capacity && p.unit ? `(${p.capacity} ${p.unit})` : ''} - (Stock: {p.stock})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Cantidad a Donar</label>
                        <input type="number" min="1" value={donationQuantity} onChange={e => setDonationQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem', fontWeight: 'bold' }}>
                        Donar
                    </button>
                </form>
            </div>

            <div className="card">
                <h3>Historial de Donaciones</h3>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {!donations || donations.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay donaciones registradas.</p>
                    ) : (
                        donations.slice(0, 5).map(donation => (
                            <div key={donation.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
                                <div>
                                    <span style={{ display: 'block', fontWeight: 'bold' }}>{donation.productName} (x{donation.quantity})</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Donado por/para: {donation.donatedBy}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(donation.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
