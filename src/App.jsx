import { AuthProvider, useAuth } from './context/AuthContext';
import { GymProvider } from './context/GymContext';
import Login from './pages/Login';
import MainLayout from './pages/MainLayout';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  return user ? <MainLayout /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <GymProvider>
        <AppContent />
      </GymProvider>
    </AuthProvider>
  );
}

export default App;

