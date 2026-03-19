import { useState } from 'react';
import Navbar from '../components/Navbar';
import DashboardStats from '../components/DashboardStats';
import UserList from '../components/UserList';
import CheckIn from '../components/CheckIn';
import VisitHistory from '../components/VisitHistory';
import EmployeeManager from '../components/EmployeeManager';
import OneTimeVisit from '../components/OneTimeVisit';
import Sales from '../components/Sales';
import Stock from '../components/Stock';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
    const [activeTab, setActiveTab] = useState('users');
    const { user } = useAuth();

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return user.role === 'admin' ? <DashboardStats /> : <UserList />;
            case 'employees':
                return user.role === 'admin' ? <EmployeeManager /> : <UserList />;
            case 'users':
                return <UserList />;
            case 'checkin':
                return <CheckIn />;
            case 'visitas':
                return <OneTimeVisit />;
            case 'history':
                return <VisitHistory />;
            case 'ventas':
                return <Sales />;
            case 'stock':
                return <Stock />;
            default:
                return <UserList />;
        }
    };

    return (
        <div>
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="container fade-in">
                {renderContent()}
            </div>
        </div>
    );
}
