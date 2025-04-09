import axios from 'axios';
import store from '@/store/store';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

// Intercepteur pour ajouter le token à toutes les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    const { user } = store.getState().auth;
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Déconnecter l'utilisateur si le token est invalide
      store.dispatch({ type: 'auth/logoutUser/fulfilled' });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 