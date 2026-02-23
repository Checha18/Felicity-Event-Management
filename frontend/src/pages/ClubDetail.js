import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import axios from '../api/axios';
import Navbar from '../components/Navbar';

function ClubDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [organizer, setOrganizer] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('upcoming');
    const [followedClubs, setFollowedClubs] = useState([]);

    useEffect(() => {
        fetchOrganizerDetails();
        if (user) {
            setFollowedClubs(user.followedClubs || []);
        }
    }, [id, user]);

    const fetchOrganizerDetails = async () => {
        try {
            setLoading(true);
            const data = await axios.get(`/organizers/${id}`);
            setOrganizer(data.organizer);
            setUpcomingEvents(data.upcomingEvents || []);
            setPastEvents(data.pastEvents || []);
            setError('');
        } catch (err) {
            setError('Failed to load organizer details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            const data = await axios.post(`/participants/follow/${id}`);
            setFollowedClubs(data.followedClubs);

            // Update user in localStorage
            const updatedUser = { ...user, followedClubs: data.followedClubs };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to follow organizer');
        }
    };

    const handleUnfollow = async () => {
        try {
            const data = await axios.delete(`/participants/follow/${id}`);
            setFollowedClubs(data.followedClubs);

            // Update user in localStorage
            const updatedUser = { ...user, followedClubs: data.followedClubs };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unfollow organizer');
        }
    };

    const isFollowing = () => {
        return followedClubs.includes(id);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ padding: '20px' }}>
                    <p>Loading organizer details...</p>
                </div>
            </div>
        );
    }

    if (error || !organizer) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ padding: '20px' }}>
                    <button onClick={() => navigate('/clubs')} style={{ padding: '8px 16px', marginBottom: '20px' }}>
                        ← Back to Clubs
                    </button>
                    <p style={{ color: 'red' }}>{error || 'Organizer not found'}</p>
                </div>
            </div>
        );
    }

    const eventsToDisplay = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <button onClick={() => navigate('/clubs')} style={{ padding: '8px 16px', marginBottom: '20px' }}>
                    ← Back to Clubs
                </button>

                {/* Organizer Info */}
                <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '30px', backgroundColor: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <h1 style={{ marginTop: 0 }}>{organizer.organizerName}</h1>
                            <p><strong>Email:</strong> {organizer.contactEmail}</p>
                            {organizer.contactNumber && (
                                <p><strong>Contact:</strong> {organizer.contactNumber}</p>
                            )}
                            {organizer.description && (
                                <p style={{ color: '#666', marginTop: '10px' }}>{organizer.description}</p>
                            )}
                        </div>

                        <div>
                            {user && (
                                isFollowing() ? (
                                    <button
                                        onClick={handleUnfollow}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: 'white',
                                            border: '1px solid black',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Following
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: 'black',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Follow
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Events Tabs */}
                <h2>Events</h2>
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        style={{
                            padding: '10px 20px',
                            marginRight: '10px',
                            backgroundColor: activeTab === 'upcoming' ? 'black' : 'white',
                            color: activeTab === 'upcoming' ? 'white' : 'black',
                            border: '1px solid black',
                            cursor: 'pointer'
                        }}
                    >
                        Upcoming ({upcomingEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === 'past' ? 'black' : 'white',
                            color: activeTab === 'past' ? 'white' : 'black',
                            border: '1px solid black',
                            cursor: 'pointer'
                        }}
                    >
                        Past ({pastEvents.length})
                    </button>
                </div>

                {/* Events List */}
                {eventsToDisplay.length === 0 ? (
                    <p>No {activeTab} events.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {eventsToDisplay.map(event => (
                            <div
                                key={event._id}
                                style={{
                                    border: '1px solid #ccc',
                                    padding: '15px',
                                    cursor: 'pointer',
                                    backgroundColor: '#f9f9f9'
                                }}
                                onClick={() => navigate(`/events/${event._id}`)}
                            >
                                <h3 style={{ marginTop: 0 }}>{event.name}</h3>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Type:</strong> {event.eventType} | <strong>Status:</strong> {event.status}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Date:</strong> {formatDate(event.startDate)} to {formatDate(event.endDate)}
                                </p>
                                <p style={{ margin: '5px 0' }}>
                                    <strong>Location:</strong> {event.locationOfEvent}
                                </p>
                                {event.eventType === 'Normal' && (
                                    <p style={{ margin: '5px 0' }}>
                                        <strong>Capacity:</strong> {event.currentRegistrations || 0} / {event.maxCapacity}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}

export default ClubDetail;
