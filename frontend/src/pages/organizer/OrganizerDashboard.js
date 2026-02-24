import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function OrganizerDashboard() {
    const navigate = useNavigate();
    useAuth();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchMyEvents();
        fetchStats();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/events/my-events');
            setEvents(data.events);
            setError('');
        } catch (err) {
            setError('Failed to load events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await axios.get('/events/my-events/stats');
            setStats(data.stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handlePublish = async (eventId) => {
        try {
            await axios.patch(`/events/${eventId}/publish`);
            fetchMyEvents(); // refresh
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to publish event');
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await axios.delete(`/events/${eventId}`);
            fetchMyEvents();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete event');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: { bg: '#f0f0f0', color: '#666' },
            published: { bg: '#d4edda', color: '#155724' },
            ongoing: { bg: '#fff3cd', color: '#856404' },
            closed: { bg: '#f8d7da', color: '#721c24' }
        };

        const style = colors[status] || colors.draft;

        return (
            <span style={{
                padding: '4px 12px',
                backgroundColor: style.bg,
                color: style.color,
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
                {status.toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>Organizer Dashboard</h1>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {/* Event counts */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                }}>
                    {[
                        { label: 'Total Events', value: events.length },
                        { label: 'Published', value: events.filter(e => e.status === 'published').length },
                        { label: 'Ongoing', value: events.filter(e => e.status === 'ongoing').length },
                        { label: 'Closed', value: events.filter(e => e.status === 'closed').length },
                        { label: 'Draft', value: events.filter(e => e.status === 'draft').length }
                    ].map(item => (
                        <div key={item.label} style={{ padding: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>{item.label}</p>
                            <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Aggregate analytics */}
                {stats && (
                    <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                        <h2 style={{ marginTop: 0 }}>Overall Analytics</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Total Registrations</p>
                                <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.totalRegistrations}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Total Revenue</p>
                                <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>Rs.{stats.totalRevenue}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Total Attended</p>
                                <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.totalAttended}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Completed Events</p>
                                <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.completedEvents}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Events List */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>My Events</h2>
                    <button
                        onClick={() => navigate('/organizer/create-event')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'black',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        + Create New Event
                    </button>
                </div>

                {events.length === 0 ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <p>No events created yet.</p>
                        <button
                            onClick={() => navigate('/organizer/create-event')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            Create Your First Event
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {events.map(event => (
                            <div key={event._id} style={{
                                border: '1px solid #ddd',
                                padding: '20px',
                                backgroundColor: '#fff',
                                cursor: 'pointer'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <h3
                                        style={{ margin: '0 0 10px 0', cursor: 'pointer' }}
                                        onClick={() => navigate(`/organizer/events/${event._id}`)}
                                    >
                                        {event.name}
                                    </h3>
                                    {getStatusBadge(event.status)}
                                    <span style={{
                                        marginLeft: '10px',
                                        padding: '4px 8px',
                                        backgroundColor: '#e9ecef',
                                        fontSize: '12px',
                                        borderRadius: '3px'
                                    }}>
                                        {event.eventType}
                                    </span>
                                </div>

                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                                    {event.description.substring(0, 100)}
                                    {event.description.length > 100 && '...'}
                                </p>

                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Date:</strong> {formatDate(event.startDate)}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Location:</strong> {event.locationOfEvent}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Capacity:</strong> {event.maxParticipants}
                                </p>

                                {/* Action Buttons */}
                                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => navigate(`/organizer/events/${event._id}`)}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'black',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        View Details
                                    </button>

                                    {event.status === 'draft' && (
                                        <>
                                            <button
                                                onClick={() => navigate(`/organizer/events/${event._id}/edit`)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'white',
                                                    color: 'black',
                                                    border: '1px solid black',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handlePublish(event._id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Publish
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event._id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}

                                    {event.status === 'published' && (
                                        <button
                                            onClick={() => navigate(`/organizer/events/${event._id}/edit`)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'white',
                                                color: 'black',
                                                border: '1px solid black',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Edit (Limited)
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrganizerDashboard;
