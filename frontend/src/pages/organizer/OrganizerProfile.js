import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import axios from '../../api/axios';
import OrganizerNavbar from '../../components/OrganizerNavbar';

function OrganizerProfile() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // profile fields
    const [organizerName, setOrganizerName] = useState('');
    const [description, setDescription] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [discordWebhook, setDiscordWebhook] = useState('');

    // password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setOrganizerName(user.organizerName || '');
            setDescription(user.description || '');
            setContactNumber(user.contactNumber || '');
            setDiscordWebhook(user.discordWebhook || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const data = await axios.put('/organizers/profile', {
                organizerName,
                description,
                contactNumber,
                discordWebhook
            });

            // update user in context
            setUser(data.organizer);
            localStorage.setItem('user', JSON.stringify(data.organizer));

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
            await axios.put('/organizers/change-password', {
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
                <OrganizerNavbar />
                <div style={{ padding: '20px' }}>
                    <p>Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
            <OrganizerNavbar />
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Organizer Profile</h1>

                {/* Profile Information */}
                <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
                    <h2>Profile Information</h2>

                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                    {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

                    <form onSubmit={handleUpdateProfile}>
                        {/* Non-editable */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Email (cannot be changed)</strong>
                            </label>
                            <input
                                type="email"
                                value={user.contactEmail || user.email}
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
                                <strong>Category (cannot be changed)</strong>
                            </label>
                            <input
                                type="text"
                                value={user.category || ''}
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

                        {/* Editable */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Organizer Name *</strong>
                            </label>
                            <input
                                type="text"
                                value={organizerName}
                                onChange={(e) => setOrganizerName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Description *</strong>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Contact Number</strong>
                            </label>
                            <input
                                type="tel"
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <strong>Discord Webhook URL</strong>
                            </label>
                            <input
                                type="url"
                                value={discordWebhook}
                                onChange={(e) => setDiscordWebhook(e.target.value)}
                                placeholder="https://discord.com/api/webhooks/..."
                                style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                            />
                            <small style={{ color: '#666' }}>
                                Optional: Receive notifications when events are published
                            </small>
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

                {/* Password Change */}
                <div style={{ border: '1px solid #ccc', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2>Change Password</h2>
                        <button
                            type="button"
                            onClick={() => navigate('/organizer/password-reset')}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#007bff',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '14px'
                            }}
                        >
                            Forgot Password? Request Reset →
                        </button>
                    </div>

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

export default OrganizerProfile;
