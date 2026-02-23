import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function MyEvents() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, draft, published, ongoing, closed

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/events/my-events');
            setEvents(data.events);
        } catch (err) {
            setError('Failed to load events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        return event.status === filter;
    });

    const FilterButton = ({ value, label }) => (
        <button
            onClick={() => setFilter(value)}
            style={{
                padding: '8px 16px',
                backgroundColor: filter === value ? 'black' : 'white',
                color: filter === value ? 'white' : 'black',
                border: '1px solid black',
                cursor: 'pointer',
                marginRight: '10px'
            }}
        >
            {label} ({events.filter(e => value === 'all' || e.status === value).length})
        </button>
    );

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>My Events</h1>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {/* Filters */}
                <div style={{ marginBottom: '20px' }}>
                    <FilterButton value="all" label="All" />
                    <FilterButton value="draft" label="Draft" />
                    <FilterButton value="published" label="Published" />
                    <FilterButton value="ongoing" label="Ongoing" />
                    <FilterButton value="closed" label="Closed" />
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <p>No {filter !== 'all' ? filter : ''} events found.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '20px'
                    }}>
                        {filteredEvents.map(event => (
                            <div
                                key={event._id}
                                style={{
                                    border: '1px solid #ddd',
                                    padding: '20px',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(`/organizer/events/${event._id}`)}
                            >
                                <h3 style={{ margin: '0 0 10px 0' }}>{event.name}</h3>

                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: event.status === 'published' ? '#d4edda' : '#f0f0f0',
                                        color: event.status === 'published' ? '#155724' : '#666',
                                        borderRadius: '3px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        marginRight: '10px'
                                    }}>
                                        {event.status.toUpperCase()}
                                    </span>
                                    <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '3px',
                                        fontSize: '12px'
                                    }}>
                                        {event.eventType}
                                    </span>
                                </div>

                                <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                                    {event.description.substring(0, 100)}
                                    {event.description.length > 100 && '...'}
                                </p>

                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Start:</strong> {formatDate(event.startDate)}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Location:</strong> {event.locationOfEvent}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                    <strong>Capacity:</strong> {event.maxParticipants}
                                </p>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/organizer/events/${event._id}`);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'black',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyEvents;
