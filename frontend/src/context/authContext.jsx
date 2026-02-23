import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (email, password, role) => {
        const data = await axios.post('/auth/login', { email, password, role });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const register = async (userData) => {
        const data = await axios.post('/auth/register', userData);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        try {
            await axios.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    // restore user session on page load
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await axios.get('/auth/verify');
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            } catch (error) {
                console.error('Token verification failed:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            register,
            logout,
            updateUser,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};