import { defineStore } from 'pinia';
import api from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: null as any,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'admin',
        isSeller: (state) => state.user?.role === 'seller',
        isCourier: (state) => state.user?.role === 'courier',
    },
    actions: {
        async login(credentials: any) {
            try {
                const response = await api.post('/auth/login', credentials);
                this.token = response.data.access_token;
                localStorage.setItem('token', this.token || '');
                await this.fetchUser();
                router.push('/');
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        },
        async fetchUser() {
            if (!this.token) return;
            try {
                const response = await api.get('/auth/me');
                this.user = response.data;
            } catch (error) {
                this.logout();
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            router.push('/login');
        },
    },
});
