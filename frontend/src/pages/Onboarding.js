import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/authContext';

function Onboarding() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedClubs, setSelectedClubs] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const availableInterests = [
        'Technology', 'Programming', 'Design', 'Music', 'Dance',
        'Drama', 'Sports', 'Literature', 'Art', 'Photography',
        'Gaming', 'Entrepreneurship', 'Science', 'Robotics'
    ];

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const response = await axios.get('/organizers');
            setOrganizers(response.organizers || []);
        } catch (err) {
            console.error('Failed to fetch organizers:', err);
        }
    };

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleClub = (clubId) => {
        setSelectedClubs(prev =>
            prev.includes(clubId)
                ? prev.filter(id => id !== clubId)
                : [...prev, clubId]
        );
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleComplete = async () => {
        try {
            setLoading(true);
            setError('');

            // Update profile with selected preferences
            const updateData = {
                interests: selectedInterests,
                firstName: user.firstName,
                lastName: user.lastName,
                contactNumber: user.contactNumber,
                collegeName: user.collegeName
            };

            await axios.put('/participants/profile', updateData);

            // Follow selected clubs
            for (const clubId of selectedClubs) {
                try {
                    await axios.post(`/participants/follow/${clubId}`);
                } catch (err) {
                    console.error(`Failed to follow club ${clubId}:`, err);
                }
            }

            // Update local user data
            const updatedUser = {
                ...user,
                interests: selectedInterests,
                followedClubs: selectedClubs
            };
            updateUser(updatedUser);

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to save preferences. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: 'white',
            color: 'black',
            minHeight: '100vh',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                maxWidth: '800px',
                width: '100%',
                border: '1px solid #ccc',
                padding: '40px',
                backgroundColor: '#f9f9f9'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Welcome to Felicity!</h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                    Let's personalize your experience
                </p>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#ffe6e6',
                        color: '#d00',
                        marginBottom: '20px',
                        border: '1px solid #d00'
                    }}>
                        {error}
                    </div>
                )}

                {/* Progress Indicator */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px',
                    gap: '20px'
                }}>
                    <div style={{
                        padding: '10px 20px',
                        backgroundColor: step === 1 ? 'black' : '#ccc',
                        color: 'white',
                        borderRadius: '5px'
                    }}>
                        Step 1: Interests
                    </div>
                    <div style={{
                        padding: '10px 20px',
                        backgroundColor: step === 2 ? 'black' : '#ccc',
                        color: 'white',
                        borderRadius: '5px'
                    }}>
                        Step 2: Clubs
                    </div>
                </div>

                {/* Step 1: Select Interests */}
                {step === 1 && (
                    <div>
                        <h2>Select Your Interests</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Choose topics you're interested in. We'll recommend events based on your preferences.
                        </p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px',
                            marginBottom: '20px'
                        }}>
                            {availableInterests.map(interest => (
                                <div
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    style={{
                                        padding: '15px',
                                        border: '2px solid',
                                        borderColor: selectedInterests.includes(interest) ? 'black' : '#ccc',
                                        backgroundColor: selectedInterests.includes(interest) ? '#f0f0f0' : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        borderRadius: '5px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>

                        <p style={{ fontSize: '14px', color: '#666' }}>
                            Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Step 2: Select Clubs to Follow */}
                {step === 2 && (
                    <div>
                        <h2>Follow Clubs & Organizers</h2>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Follow clubs to get updates about their events and activities.
                        </p>

                        {organizers.length === 0 ? (
                            <p>No clubs available to follow yet.</p>
                        ) : (
                            <div style={{ marginBottom: '20px' }}>
                                {organizers.map(organizer => (
                                    <div
                                        key={organizer._id}
                                        onClick={() => toggleClub(organizer._id)}
                                        style={{
                                            padding: '15px',
                                            border: '2px solid',
                                            borderColor: selectedClubs.includes(organizer._id) ? 'black' : '#ccc',
                                            backgroundColor: selectedClubs.includes(organizer._id) ? '#f0f0f0' : 'white',
                                            cursor: 'pointer',
                                            marginBottom: '10px',
                                            borderRadius: '5px'
                                        }}
                                    >
                                        <h3 style={{ margin: '0 0 5px 0' }}>{organizer.organizerName}</h3>
                                        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                                            {organizer.category}
                                        </p>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                                            {organizer.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p style={{ fontSize: '14px', color: '#666' }}>
                            Following: {selectedClubs.length} club{selectedClubs.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '30px',
                    gap: '10px'
                }}>
                    <button
                        onClick={handleSkip}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'white',
                            color: 'black',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                        disabled={loading}
                    >
                        Skip for Now
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {step === 2 && (
                            <button
                                onClick={handleBack}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#666',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                                disabled={loading}
                            >
                                Back
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : step === 1 ? 'Next' : 'Complete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;
