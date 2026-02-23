import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import axios from '../api/axios';
import Navbar from '../components/Navbar';

function Clubs() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [followedClubs, setFollowedClubs] = useState([]);

    useEffect(() => {
        fetchOrganizers();
        if (user) {
            setFollowedClubs(user.followedClubs || []);
        }
    }, [user]);

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const data = await axios.get('/organizers');
            setOrganizers(data.organizers || []);
            setError('');
        } catch (err) {
            setError('Failed to load organizers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (organizerId) => {
        try {
            const data = await axios.post(`/participants/follow/${organizerId}`);
            setFollowedClubs(data.followedClubs);

            // Update user in localStorage
            const updatedUser = { ...user, followedClubs: data.followedClubs };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to follow organizer');
        }
    };

    const handleUnfollow = async (organizerId) => {
        try {
            const data = await axios.delete(`/participants/follow/${organizerId}`);
            setFollowedClubs(data.followedClubs);

            // Update user in localStorage
            const updatedUser = { ...user, followedClubs: data.followedClubs };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unfollow organizer');
        }
    };

    const isFollowing = (organizerId) => {
        return followedClubs.includes(organizerId);
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ padding: '20px' }}>
                    <p>Loading organizers...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <h1>Clubs & Organizers</h1>

                {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

                {organizers.length === 0 ? (
                    <p>No organizers found.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        {organizers.map(organizer => (
                            <div
                                key={organizer._id}
                                style={{
                                    border: '1px solid #ccc',
                                    padding: '20px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h2
                                            style={{
                                                marginTop: 0,
                                                cursor: 'pointer',
                                                textDecoration: 'underline'
                                            }}
                                            onClick={() => navigate(`/clubs/${organizer._id}`)}
                                        >
                                            {organizer.organizerName}
                                        </h2>
                                        <p style={{ margin: '10px 0' }}>
                                            <strong>Email:</strong> {organizer.contactEmail}
                                        </p>
                                        {organizer.contactNumber && (
                                            <p style={{ margin: '10px 0' }}>
                                                <strong>Contact:</strong> {organizer.contactNumber}
                                            </p>
                                        )}
                                        {organizer.description && (
                                            <p style={{ margin: '10px 0', color: '#666' }}>
                                                {organizer.description}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        {user && (
                                            isFollowing(organizer._id) ? (
                                                <button
                                                    onClick={() => handleUnfollow(organizer._id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: 'white',
                                                        border: '1px solid black',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Following
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleFollow(organizer._id)}
                                                    style={{
                                                        padding: '8px 16px',
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Clubs;
