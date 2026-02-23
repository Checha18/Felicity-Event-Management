import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const linkStyle = (path) => ({
        padding: '10px 20px',
        backgroundColor: isActive(path) ? 'black' : 'white',
        color: isActive(path) ? 'white' : 'black',
        border: '1px solid black',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block'
    });

    return (
        <nav style={{
            backgroundColor: 'white',
            borderBottom: '2px solid black',
            padding: '10px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <h2 style={{ margin: 0, marginRight: '20px' }}>Felicity</h2>
                <button onClick={() => navigate('/dashboard')} style={linkStyle('/dashboard')}>
                    Dashboard
                </button>
                <button onClick={() => navigate('/events')} style={linkStyle('/events')}>
                    Browse Events
                </button>
                <button onClick={() => navigate('/clubs')} style={linkStyle('/clubs')}>
                    Clubs/Organizers
                </button>
                <button onClick={() => navigate('/profile')} style={linkStyle('/profile')}>
                    Profile
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px' }}>
                    {user.firstName} {user.lastName}
                </span>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        color: 'red',
                        border: '1px solid red',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
