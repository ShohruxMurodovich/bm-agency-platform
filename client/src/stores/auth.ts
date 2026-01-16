import { defineStore } from 'pinia';
import api from '../api';
import router from '../router';

export interface User {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'staff' | 'seller' | 'courier' | 'public_user';
    seller_id?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: null as User | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role === 'admin',
        isSeller: (state) => state.user?.role === 'seller',
        isCourier: (state) => state.user?.role === 'courier',
        isStaff: (state) => state.user?.role === 'staff' || state.user?.role === 'admin',
    },
    actions: {
        async login(credentials: LoginCredentials) {
            try {
                const response = await api.post('/auth/login', credentials);
                this.token = response.data.access_token;
                localStorage.setItem('token', this.token || '');
                await this.fetchUser();

                // Redirect based on role
                if (this.user?.role === 'courier') {
                    router.push('/courier-dashboard');
                } else {
                    router.push('/');
                }
            } catch (error) {
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
