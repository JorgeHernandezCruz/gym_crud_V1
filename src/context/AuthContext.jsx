import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('gym_auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      const API_URL = 'http://localhost/backend/api.php';
      const loginRes = await fetch(`${API_URL}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      });
      const loginData = await loginRes.json();

      if (loginData.success) {
        setUser(loginData.data);
        localStorage.setItem('gym_auth_user', JSON.stringify(loginData.data));
        return { success: true };
      }
      return { success: false, message: loginData.message || 'Credenciales incorrectas' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Error de conexión al servidor MySQL' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gym_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
