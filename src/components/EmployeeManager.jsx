import { useState } from 'react';
import { useGym } from '../context/GymContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EmployeeManager() {
    const { employees, visits, addEmployee, deleteEmployee } = useGym();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: ''
    });
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeForHours, setSelectedEmployeeForHours] = useState('');
    
    // -- Filtros de Reporte --
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');

    // Filter only employee visits and apply search
    const employeeVisits = visits
        .filter(v => v.role === 'employee')
        .filter(v => v.userName.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addEmployee(formData);
        setFormData({ name: '', username: '', password: '' });
        setIsFormOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de eliminar este trabajador?')) {
            deleteEmployee(id);
        }
    };

    const togglePasswordVisibility = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const calculateHours = () => {
        if (!selectedEmployeeForHours) return { today: 0, week: 0, month: 0 };
        
        const empVisits = visits
            .filter(v => v.userId === selectedEmployeeForHours)
            .map(v => {
                let parsedDate = v.timestamp;
                if (typeof v.timestamp === 'string') {
                    // Try to normalize to valid format replacing space with T for Safari/JS compatibility
                    parsedDate = new Date(v.timestamp.replace(' ', 'T'));
                } else if (!(v.timestamp instanceof Date)) {
                    parsedDate = new Date(v.timestamp);
                }
                return { ...v, timestampObj: parsedDate };
            })
            .sort((a, b) => a.timestampObj - b.timestampObj);

        let totalMinutesToday = 0;
        let totalMinutesWeek = 0;
        let totalMinutesMonth = 0;
        
        let reportDailyMins = {}; // { 'YYYY-MM-DD': minutos }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start on Sunday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const formatTime = (totalMins) => {
            if (totalMins < 0) totalMins = 0;
            const hours = Math.floor(totalMins / 60);
            const minutes = Math.floor(totalMins % 60);
            return `${hours}h ${minutes}m`;
        };

        for (let i = 0; i < empVisits.length; i++) {
            if (empVisits[i].note === 'Entrada') {
                const entryTime = empVisits[i].timestampObj;
                let exitTime = now; // Default to now if still working

                // Find the next exit
                if (i + 1 < empVisits.length && empVisits[i + 1].note === 'Salida') {
                    exitTime = empVisits[i + 1].timestampObj;
                    i++; // Skip the exit visit in the loop
                } else if (exitTime < entryTime) {
                    // Prevent negative duration if server time is ahead of local time
                    exitTime = entryTime;
                }

                if (isNaN(entryTime.getTime()) || isNaN(exitTime.getTime())) continue;

                const durationMinutes = (exitTime - entryTime) / (1000 * 60);

                if (entryTime >= startOfDay) {
                    totalMinutesToday += durationMinutes;
                }
                if (entryTime >= startOfWeek) {
                    totalMinutesWeek += durationMinutes;
                }
                if (entryTime >= startOfMonth) {
                    totalMinutesMonth += durationMinutes;
                }
                
                // Agrupando para el reporte si entra en el filtro de fechas
                let isWithinReport = true;
                if (reportStartDate) {
                    const startStr = new Date(reportStartDate);
                    startStr.setHours(0,0,0,0);
                    // Usamos un simple Date local para evitar problemas de huso horario con setHours
                    // entryTime es un Date local
                    if (entryTime < startStr) isWithinReport = false;
                }
                if (reportEndDate) {
                    const endStr = new Date(reportEndDate);
                    endStr.setHours(23,59,59,999);
                    if (entryTime > endStr) isWithinReport = false;
                }

                if (isWithinReport) {
                    // Use local date string to avoid timezone shifts (e.g. 2026-03-18 vs 2026-03-17)
                    // Padded month and day
                    const YYYY = entryTime.getFullYear();
                    const MM = String(entryTime.getMonth() + 1).padStart(2, '0');
                    const DD = String(entryTime.getDate()).padStart(2, '0');
                    const dayKey = `${YYYY}-${MM}-${DD}`;
                    
                    reportDailyMins[dayKey] = (reportDailyMins[dayKey] || 0) + durationMinutes;
                }
            }
        }
        
        const chartData = Object.keys(reportDailyMins).sort().map(date => {
            const totalMins = Math.max(0, reportDailyMins[date]);
            const hours = Math.floor(totalMins / 60);
            const minutes = Math.floor(totalMins % 60);
            return {
                fecha: date,
                horasDecimal: Number((totalMins / 60).toFixed(2)),
                horasFormat: `${hours}h ${minutes}m`
            };
        });

        return {
            today: formatTime(totalMinutesToday),
            week: formatTime(totalMinutesWeek),
            month: formatTime(totalMinutesMonth),
            chartData
        };
    };

    const hoursData = calculateHours();

    const handleDownloadCSV = () => {
        if (!hoursData.chartData || hoursData.chartData.length === 0) {
            alert('No hay datos en el rango seleccionado para exportar.');
            return;
        }

        const employeeName = employees.find(e => e.id === selectedEmployeeForHours)?.name || 'Trabajador';
        const headers = ['Fecha', 'Trabajador', 'Horas Decimales', 'Horas Formateadas'];
        const csvRows = [
            headers.join(','),
            ...hoursData.chartData.map(row => `${row.fecha},"${employeeName}",${row.horasDecimal},"${row.horasFormat}"`)
        ];
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Reporte_Horas_${employeeName}_${reportStartDate || 'inicio'}_a_${reportEndDate || 'fin'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)' }}>Gestión de Trabajadores</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Registra nuevos empleados y monitorea su asistencia.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setIsFormOpen(true)}
                >
                    + Nuevo Trabajador
                </button>
            </div>

            {isFormOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Registrar Nuevo Trabajador</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem' }}>Nombre Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej. Ana García"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem' }}>Usuario</label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Ej. agarcia"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem' }}>Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="******"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="btn-danger"
                                    style={{ border: 'none', color: 'var(--text-secondary)' }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Crear Trabajador
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
                {/* Employees List */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Lista de Trabajadores</h3>
                    {employees.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay trabajadores registrados.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>ID</th>
                                        <th style={{ padding: '0.5rem' }}>Nombre</th>
                                        <th style={{ padding: '0.5rem' }}>Usuario</th>
                                        <th style={{ padding: '0.5rem' }}>Contraseña</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{emp.id}</td>
                                            <td style={{ padding: '0.5rem' }}>{emp.name}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{emp.username}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span>{visiblePasswords[emp.id] ? emp.password : '••••••'}</span>
                                                    <button 
                                                        onClick={() => togglePasswordVisibility(emp.id)}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            fontSize: '1rem',
                                                            opacity: 0.8
                                                        }}
                                                        title={visiblePasswords[emp.id] ? "Ocultar Contraseña" : "Ver Contraseña"}
                                                    >
                                                        {visiblePasswords[emp.id] ? '🙈' : '👁️'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDelete(emp.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Worked Hours Summary */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Horas Trabajadas</h3>
                    <select 
                        value={selectedEmployeeForHours} 
                        onChange={(e) => setSelectedEmployeeForHours(e.target.value)}
                        style={{ maxWidth: '300px', width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', cursor: 'pointer' }}
                    >
                        <option value="">-- Seleccionar Trabajador --</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id} style={{ color: '#000', backgroundColor: '#fff' }}>{emp.name}</option>
                        ))}
                    </select>
                </div>

                {selectedEmployeeForHours ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Hoy</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>{hoursData.today}</p>
                        </div>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📆</div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Esta Semana</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>{hoursData.week}</p>
                        </div>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Este Mes</h4>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>{hoursData.month}</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Seleccione un trabajador arriba para visualizar sus horas.
                    </div>
                )}
            </div>

            {/* Attendance Log */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Asistencia de Trabajadores</h3>
                    <input
                        type="search"
                        placeholder="Buscar trabajador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: '300px', width: '100%' }}
                    />
                </div>
                {employeeVisits.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No hay registros de asistencia.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Fecha y Hora</th>
                                    <th style={{ padding: '1rem' }}>Trabajador</th>
                                    <th style={{ padding: '1rem' }}>ID</th>
                                    <th style={{ padding: '1rem' }}>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeVisits.map(visit => (
                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(visit.timestamp).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{visit.userName}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{visit.userId}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                backgroundColor: visit.note === 'Entrada' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: visit.note === 'Entrada' ? 'var(--success)' : 'var(--danger)',
                                                display: 'inline-block'
                                            }}>
                                                {visit.note || 'Desconocido'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* SECCIÓN REPORTE GRAFICA */}
            <div className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h3>Reporte Detallado por Trabajador</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Visualiza las horas trabajadas por día y descarga los datos</p>
                    </div>
                    {selectedEmployeeForHours && (
                        <button onClick={handleDownloadCSV} style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            Descargar CSV
                        </button>
                    )}
                </div>

                {selectedEmployeeForHours ? (
                    <>
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
                            <div style={{ paddingBottom: '0.2rem' }}>
                                <button onClick={() => { setReportStartDate(''); setReportEndDate(''); }} className="btn-danger" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.2)' }}>
                                    Limpiar Fechas
                                </button>
                            </div>
                        </div>

                        {/* Contenedor del Gráfico */}
                        {hoursData.chartData && hoursData.chartData.length > 0 ? (
                            <div style={{ width: '100%', height: 350, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={hoursData.chartData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 25 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                        <XAxis 
                                            dataKey="fecha" 
                                            stroke="var(--text-secondary)" 
                                            tick={{ fill: 'var(--text-secondary)' }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(0,0,0,0.1)', color: 'white' }}
                                            itemStyle={{ color: 'var(--accent)' }}
                                            formatter={(value, name, props) => {
                                                if (name === 'horasDecimal') return [`${value} hrs (${props.payload.horasFormat})`, 'Horas Trabajadas'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Bar dataKey="horasDecimal" name="Horas Totales del Día" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius)' }}>
                                No hay horas registradas en este bloque de fechas para el trabajador.
                            </p>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Selecciona un trabajador en la sección superior para ver sus reportes específicos.
                    </div>
                )}
            </div>
        </div>
    );
}
