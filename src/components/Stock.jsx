import { useState } from 'react';
import { useGym } from '../context/GymContext';
import Swal from 'sweetalert2';

export default function Stock() {
    const { products, updateStock, addProduct, deleteProduct, loading } = useGym();
    
    // States for Update Stock
    const [selectedProductId, setSelectedProductId] = useState('');
    const [addQuantity, setAddQuantity] = useState('');

    // States for New Product
    const [showNewProduct, setShowNewProduct] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductStock, setNewProductStock] = useState('');
    const [newProductCapacity, setNewProductCapacity] = useState('');
    const [newProductUnit, setNewProductUnit] = useState('ml');

    const handleUpdateStock = async (e) => {
        e.preventDefault();
        if (!selectedProductId || !addQuantity) return;
        
        await updateStock(Number(selectedProductId), Number(addQuantity));
        setSelectedProductId('');
        setAddQuantity('');
        Swal.fire({
            title: '¡Stock Actualizado!',
            text: 'El inventario se ha actualizado correctamente.',
            icon: 'success',
            confirmButtonColor: '#22c55e',
            timer: 2500,
            showConfirmButton: false
        });
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

    const handleDeleteProduct = (id) => {
        Swal.fire({
            title: '¿Eliminar producto?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteProduct(id);
                Swal.fire(
                    'Eliminado',
                    'El producto ah sido borrado de tu inventario.',
                    'success'
                );
            }
        })
    };

    if (loading) return <p>Cargando stock...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)' }}>Stock de Productos</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Consulta y actualiza el inventario general</p>
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
                <h3>Añadir al Stock</h3>
                <form onSubmit={handleUpdateStock} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
                    <div>
                        <label>Producto</label>
                        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} required>
                            <option value="">Seleccione un producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Stock actual: {p.stock})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Cantidad a añadir</label>
                        <input type="number" min="1" value={addQuantity} onChange={e => setAddQuantity(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1rem' }}>Actualizar Stock</button>
                </form>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {products.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay productos registrados.</p>
                    ) : (
                        products.map(product => (
                            <div key={product.id} style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                        {product.name} {product.capacity && product.unit ? `(${product.capacity} ${product.unit})` : ''}
                                    </span>
                                    <button 
                                        onClick={() => handleDeleteProduct(product.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem', fontSize: '1.1rem' }}
                                        title="Eliminar producto"
                                    >×</button>
                                </div>
                                <span style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Precio: ${product.price}</span>
                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        padding: '0.2rem 0.5rem', 
                                        borderRadius: '4px',
                                        backgroundColor: product.stock > 5 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                        color: product.stock > 5 ? 'var(--success)' : 'var(--danger)'
                                    }}>
                                        Stock: {product.stock}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
