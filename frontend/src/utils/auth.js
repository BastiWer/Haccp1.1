import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getRestaurant = () => {
  const restaurantStr = localStorage.getItem('restaurant');
  return restaurantStr ? JSON.parse(restaurantStr) : null;
};

export const setRestaurant = (restaurant) => {
  localStorage.setItem('restaurant', JSON.stringify(restaurant));
};

export const logout = () => {
  removeToken();
  localStorage.removeItem('user');
  localStorage.removeItem('restaurant');
};

export const isAuthenticated = () => {
  return !!getToken();
};

// Axios interceptor to add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.url?.includes('/api/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor to handle 401 responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);