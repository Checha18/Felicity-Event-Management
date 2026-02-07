import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Login Function
    const login = async(email, password, role) => {
        try {
            const data = await axios.post('/auth/login', { email, password, role });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return data;
        }
        catch (error) {
            throw error;
        }
    };

    // Register Function
    const register = async(userData) => {
        try {
            const data = await axios.post('/auth/register', userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return data;
        }
        catch (error){
            throw error;
        }
    };

    // Logout Function
    const logout = async () => {
        try {
            await axios.post('/auth/logout');
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    };

    // Update User Function
    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    // Effect: Restore user if token exists
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if(!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await axios.get('/auth/verify');
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            catch (error) {
                console.error('Token Verification Failed: ', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
            finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    // This object contains everything that is to be shared with the components
    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser
    };


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}