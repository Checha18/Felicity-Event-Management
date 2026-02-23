import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import axios from '../api/axios';
import Navbar from '../components/Navbar';

function Profile() {
    const { user, setUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Profile fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [interests, setInterests] = useState('');

    // Password change fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setContactNumber(user.contactNumber || '');
            setCollegeName(user.collegeName || '');
            setInterests(user.interests?.join(', ') || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);

            const data = await axios.put('/participants/profile', {
                firstName,
                lastName,
                contactNumber,
                collegeName,
                interests: interestsArray
            });

            // Update user in context and localStorage
            setUser(data.participant);
            localStorage.setItem('user', JSON.stringify(data.participant));

            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            await axios.put('/participants/change-password', {
                currentPassword,
                newPassword
            });

            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (!user) {
        return (
            <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ padding: '20px' }}>
                    <p>Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Edit Profile</h1>

                {/* Profile Information Section */}
                <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Profile Information</h2>

                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                    {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

                    <form onSubmit={handleUpdateProfile}>
                        {/* Non-editable fields */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Email (cannot be changed)</strong>
                            </label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#f0f0f0',
                                    border: '1px solid #ccc',
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Participant Type (cannot be changed)</strong>
                            </label>
                            <input
                                type="text"
                                value={user.participantType}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#f0f0f0',
                                    border: '1px solid #ccc',
                                    cursor: 'not-allowed'
                                }}
                            />
                        </div>

                        {/* Editable fields */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>First Name *</strong>
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Last Name *</strong>
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Contact Number *</strong>
                            </label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        {/* Only show college name for Non-IIIT participants */}
                        {user.participantType === 'Non-IIIT' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                    <strong>College/Organization Name *</strong>
                                </label>
                                <input
                                    type="text"
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Interests (comma-separated)</strong>
                            </label>
                            <input
                                type="text"
                                value={interests}
                                onChange={(e) => setInterests(e.target.value)}
                                placeholder="e.g., Coding, Music, Sports"
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                            <small style={{ color: '#666' }}>Separate multiple interests with commas</small>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                {/* Password Change Section */}
                <div style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Change Password</h2>

                    {passwordError && <div style={{ color: 'red', marginBottom: '10px' }}>{passwordError}</div>}
                    {passwordSuccess && <div style={{ color: 'green', marginBottom: '10px' }}>{passwordSuccess}</div>}

                    <form onSubmit={handleChangePassword}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Current Password *</strong>
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>New Password *</strong>
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                            <small style={{ color: '#666' }}>Minimum 6 characters</small>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Confirm New Password *</strong>
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'black',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Change Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Profile;
