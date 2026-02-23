import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import AdminNavbar from '../../components/AdminNavbar';

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/admin/stats');
            setStats(data.stats);
            setError('');
        } catch (err) {
            setError('Failed to load statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <AdminNavbar />
                <div style={{ padding: '20px' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <AdminNavbar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>Admin Dashboard</h1>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {/* Statistics Cards */}
                {stats && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            padding: '30px',
                            border: '2px solid black',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
                                Total Organizers
                            </h3>
                            <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold' }}>
                                {stats.totalOrganizers}
                            </p>
                        </div>

                        <div style={{
                            padding: '30px',
                            border: '2px solid black',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
                                Total Events
                            </h3>
                            <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold' }}>
                                {stats.totalEvents}
                            </p>
                            <p style={{ fontSize: '14px', margin: '10px 0 0 0', color: '#666' }}>
                                Published: {stats.publishedEvents} | Draft: {stats.draftEvents}
                            </p>
                        </div>

                        <div style={{
                            padding: '30px',
                            border: '2px solid black',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
                                Total Participants
                            </h3>
                            <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold' }}>
                                {stats.totalParticipants}
                            </p>
                        </div>

                        <div style={{
                            padding: '30px',
                            border: '2px solid black',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>
                                Total Registrations
                            </h3>
                            <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold' }}>
                                {stats.totalRegistrations}
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{
                    marginTop: '40px',
                    padding: '30px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff'
                }}>
                    <h2>Quick Actions</h2>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                        <button
                            onClick={() => navigate('/admin/manage-organizers')}
                            style={{
                                padding: '15px 30px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Manage Organizers
                        </button>
                    </div>
                </div>

                {/* System Info */}
                <div style={{
                    marginTop: '30px',
                    padding: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h3>System Information</h3>
                    <p style={{ margin: '10px 0' }}>
                        <strong>Role:</strong> Administrator
                    </p>
                    <p style={{ margin: '10px 0' }}>
                        <strong>Access Level:</strong> Full System Access
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
