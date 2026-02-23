import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function ProfileMenu() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    if (!user) return null;

    const getInitials = () => {
        const first = user.firstName?.[0] || '';
        const last = user.lastName?.[0] || '';
        return (first + last).toUpperCase();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'black',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}
            >
                {getInitials()}
            </button>

            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    minWidth: '150px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}>
                    <button
                        onClick={() => {
                            setShowDropdown(false);
                            navigate('/my-events');
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        My Events
                    </button>
                    <button
                        onClick={() => {
                            setShowDropdown(false);
                            navigate('/profile');
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        Edit Profile
                    </button>
                    <button
                        onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 15px',
                            border: 'none',
                            backgroundColor: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: 'red'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfileMenu;
