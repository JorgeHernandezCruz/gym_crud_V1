import { createContext, useState, useContext, useEffect } from 'react';

const GymContext = createContext();

export const useGym = () => useContext(GymContext);

const API_URL = 'http://localhost/backend/api.php'; // Cambia esto si tu carpeta en XAMPP se llama diferente

export const GymProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [visits, setVisits] = useState([]);
    const [prices, setPrices] = useState({ monthly: 450, annual: 4500, quincenal: 250, student: 400 });
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [donations, setDonations] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar datos iniciales desde PHP MySQL
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, visitsRes, pricesRes, empRes, prodsRes, salesRes, donationsRes, promoRes] = await Promise.all([
                    fetch(`${API_URL}?action=getUsers`),
                    fetch(`${API_URL}?action=getVisits`),
                    fetch(`${API_URL}?action=getPrices`),
                    fetch(`${API_URL}?action=getEmployees`),
                    fetch(`${API_URL}?action=getProducts`),
                    fetch(`${API_URL}?action=getSales`),
                    fetch(`${API_URL}?action=getDonations`),
                    fetch(`${API_URL}?action=getPromotions`)
                ]);

                const usersData = await usersRes.json();
                const visitsData = await visitsRes.json();
                const pricesData = await pricesRes.json();
                const empData = await empRes.json();
                const prodsData = await prodsRes.json();
                const salesData = await salesRes.json();
                const donationsData = await donationsRes.json();
                const promoData = await promoRes.json();

                if (usersData.success) setUsers(usersData.data);
                if (visitsData.success) setVisits(visitsData.data);
                if (pricesData.success) setPrices({ 
                    monthly: parseFloat(pricesData.data.monthly),
                    annual: parseFloat(pricesData.data.annual), quincenal: parseFloat(pricesData.data.quincenal), student: parseFloat(pricesData.data.student)
                });
                if (empData.success) setEmployees(empData.data);
                if (prodsData.success) setProducts(prodsData.data);
                if (salesData.success) setSales(salesData.data);
                if (donationsData.success) setDonations(donationsData.data);
                if (promoData.success) setPromotions(promoData.data);

            } catch (error) {
                console.error("Error cargando datos de la base de datos:", error);
                alert("Error de conexión a la base de datos MySQL (Por favor verifica que XAMPP esté encendido)");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const addUser = async (userData) => {
        try {
            const response = await fetch(`${API_URL}?action=addUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (data.success) {
                setUsers([...users, data.data]); // Update local state
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error al agregar usuario" };
        }
    };

    const updateUser = async (id, updatedData) => {
        try {
            const response = await fetch(`${API_URL}?action=updateUser`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updatedData })
            });
            const data = await response.json();
            if (data.success) {
                // To keep the user's view perfectly synced with the db format it's often 
                // easiest to just refetch the user or update locally if simple. Let's update locally first.
                // We need the promotion name and percentage if a promotion was added.
                const appliedPromo = promotions.find(p => p.id === updatedData.promotion_id);
                setUsers(users.map(user => user.id === id ? { 
                    ...user, 
                    ...updatedData, 
                    promotion_name: appliedPromo ? appliedPromo.name : null,
                    discount_percentage: appliedPromo ? appliedPromo.discount_percentage : null 
                } : user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
             console.error("Error:", error);
             return { success: false, message: "Error al actualizar usuario" };
        }
    };

    const renewSubscription = async (id, subscriptionType) => {
        try {
            const response = await fetch(`${API_URL}?action=renewUser`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, subscriptionType })
            });
            const data = await response.json();
            if (data.success) {
                const { createdAt, expirationDate } = data.data;
                setUsers(users.map(user => user.id === id ? { 
                    ...user, 
                    createdAt, 
                    expirationDate,
                    subscriptionType
                } : user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
             console.error("Error:", error);
             return { success: false, message: "Error al renovar usuario" };
        }
    };

    const deleteUser = async (id) => {
        try {
            const response = await fetch(`${API_URL}?action=deleteUser&id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setUsers(users.filter(user => user.id !== id));
            } else {
                alert("Error eliminando usuario: " + data.message);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const addEmployee = async (employeeData) => {
        try {
            const response = await fetch(`${API_URL}?action=addEmployee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });
            const data = await response.json();
            if (data.success) {
                setEmployees([...employees, data.data]);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error(error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const deleteEmployee = async (id) => {
         try {
            const response = await fetch(`${API_URL}?action=deleteEmployee&id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setEmployees(employees.filter(emp => emp.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const registerOneTimeVisit = async (visitorData) => {
        try {
            const response = await fetch(`${API_URL}?action=registerOneTimeVisit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(visitorData)
            });
            const data = await response.json();
            if (data.success) {
                setVisits([data.data, ...visits]);
                return { success: true, message: data.message };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const registerVisit = async (userId) => {
         try {
            const response = await fetch(`${API_URL}?action=registerVisit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await response.json();
            if (data.success) {
                setVisits([data.data, ...visits]);
                return { success: true, message: data.message };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error al registrar visita" };
        }
    };

    const updatePrices = async (newPrices) => {
        try {
            const response = await fetch(`${API_URL}?action=updatePrices`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPrices)
            });
            const data = await response.json();
            if (data.success) {
                setPrices(newPrices);
            }
        } catch (error) {
            console.error("Error al actualizar precios:", error);
        }
    };

    const addProduct = async (productData) => {
        try {
            const response = await fetch(`${API_URL}?action=addProduct`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            const data = await response.json();
            if (data.success) {
                setProducts([...products, data.data]);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const deleteProduct = async (id) => {
        try {
            const response = await fetch(`${API_URL}?action=deleteProduct&id=${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setProducts(products.filter(p => String(p.id) !== String(id)));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const updateStock = async (id, quantity) => {
        try {
            const response = await fetch(`${API_URL}?action=updateStock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, quantity })
            });
            const data = await response.json();
            if (data.success) {
                setProducts(products.map(p => String(p.id) === String(id) ? { ...p, stock: Number(p.stock) + Number(quantity) } : p));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const registerSale = async (saleData) => {
        try {
            const response = await fetch(`${API_URL}?action=registerSale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });
            const data = await response.json();
            if (data.success) {
                const newSale = data.data;
                setSales([newSale, ...sales]);
                setProducts(products.map(p => String(p.id) === String(newSale.productId) ? { ...p, stock: Number(p.stock) - Number(newSale.quantity) } : p));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const registerDonation = async (donationData) => {
        try {
            const response = await fetch(`${API_URL}?action=registerDonation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donationData)
            });
            const data = await response.json();
            if (data.success) {
                const newDonation = data.data;
                setDonations([newDonation, ...donations]);
                setProducts(products.map(p => String(p.id) === String(newDonation.productId) ? { ...p, stock: Number(p.stock) - Number(newDonation.quantity) } : p));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const addPromotion = async (promotionData) => {
        try {
            const response = await fetch(`${API_URL}?action=addPromotion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promotionData)
            });
            const data = await response.json();
            if (data.success) {
                setPromotions([...promotions, data.data]);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            console.error("Error:", error);
            return { success: false, message: "Error de conexión" };
        }
    };

    const deletePromotion = async (id) => {
        try {
            const response = await fetch(`${API_URL}?action=deletePromotion&id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setPromotions(promotions.filter(promo => promo.id !== id));
                // Optional: You could trigger a refetch of users here if you want their data to update immediately
                // However, they will just update on next refresh. Let's do a simple soft update:
                setUsers(users.map(user => user.promotion_id === id ? { ...user, promotion_id: null, promotion_name: null, discount_percentage: null } : user));
            } else {
                 alert("Error eliminando promoción: " + data.message);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <GymContext.Provider value={{
            users, visits, prices, employees, products, sales, donations, promotions,
            addUser, updateUser, deleteUser, registerVisit, updatePrices, renewSubscription,

            addProduct, deleteProduct, updateStock, registerSale, registerDonation, loading, addPromotion, deletePromotion
        }}>
            {children}
        </GymContext.Provider>
    );
};
