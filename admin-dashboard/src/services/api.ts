import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (user: any) => api.post('/auth/register', user),
};

export const incidentApi = {
    getNear: (lat: number, lng: number) => api.get(`/incidents/near?lat=${lat}&lng=${lng}`),
};

export default api;
