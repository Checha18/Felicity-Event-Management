import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// add auth token to requests
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // don't auto-redirect on 401 during login attempts
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)

export default instance;
