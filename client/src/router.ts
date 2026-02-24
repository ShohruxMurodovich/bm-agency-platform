import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

const AppLayout = () => import('./layouts/AppLayout.vue');
// Lazy load components
const Login = () => import('./views/Login.vue');
const Dashboard = () => import('./views/Dashboard.vue');
const NotFound = () => import('./views/NotFound.vue');

const routes = [
    { path: '/login', component: Login, meta: { guest: true } },
    { path: '/register', component: () => import('./views/Register.vue'), meta: { guest: true } },
    {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', component: Dashboard, meta: { roles: ['admin', 'staff', 'seller', 'public_user'] } },
            { path: 'courier-dashboard', component: () => import('./views/CourierDashboard.vue'), meta: { roles: ['admin', 'courier'] } },
            { path: 'parent-products', component: () => import('./views/ParentProducts.vue'), meta: { roles: ['admin', 'staff', 'seller', 'public_user'] } },
            { path: 'products', component: () => import('./views/Products.vue'), meta: { roles: ['admin', 'staff', 'seller', 'public_user'] } },
            { path: 'profit-monitoring', component: () => import('./views/ProfitMonitoring.vue'), meta: { roles: ['admin', 'staff', 'public_user'] } },
            { path: 'products/:id', component: () => import('./views/ProductDetail.vue'), meta: { roles: ['admin', 'staff', 'seller'] } },

            { path: 'send-products', component: () => import('./views/SendProducts.vue'), meta: { roles: ['admin', 'seller'] } },
            { path: 'receive-products', component: () => import('./views/ReceiveProducts.vue'), meta: { roles: ['admin', 'courier'] } },
            { path: 'return-products', component: () => import('./views/ReturnProducts.vue'), meta: { roles: ['admin', 'courier'] } },
            { path: 'accept-returns', component: () => import('./views/AcceptReturns.vue'), meta: { roles: ['admin', 'seller'] } },
            { path: 'orders', component: () => import('./views/Orders.vue'), meta: { roles: ['admin', 'staff', 'seller', 'courier', 'public_user'] } },
            { path: 'product-movements', component: () => import('./views/ProductMovements.vue'), meta: { roles: ['admin', 'staff', 'courier', 'public_user'] } },
            { path: 'product-tracking', component: () => import('./views/ProductTracking.vue'), meta: { roles: ['admin', 'staff', 'seller', 'public_user'] } },
            { path: 'product-states', component: () => import('./views/ProductStates.vue'), meta: { roles: ['admin', 'staff', 'courier', 'public_user'] } },
            { path: 'transfer-acts', component: () => import('./views/TransferActs.vue'), meta: { roles: ['admin', 'staff'] } },
            { path: 'return-acts', component: () => import('./views/ReturnActs.vue'), meta: { roles: ['admin', 'staff'] } },
            { path: 'analytics', component: () => import('./views/Analytics.vue'), meta: { roles: ['admin', 'staff', 'seller'] } },
            { path: 'notifications', component: () => import('./views/Notifications.vue'), meta: { roles: ['admin', 'staff', 'seller', 'courier'] } },
            { path: 'settings', component: () => import('./views/Settings.vue'), meta: { roles: ['admin'] } },
            { path: 'subscription', component: () => import('./views/SubscriptionSettings.vue'), meta: { roles: ['public_user'] } },
            { path: 'analytics', component: () => import('./views/Analytics.vue'), meta: { roles: ['admin', 'staff', 'seller'] } },
            { path: 'public-analytics', component: () => import('./views/PublicAnalytics.vue'), meta: { roles: ['public_user'] } },
            { path: 'stores', component: () => import('./views/Stores.vue'), meta: { roles: ['admin', 'public_user'] } },
            { path: 'sellers', component: () => import('./views/Sellers.vue'), meta: { roles: ['admin'] } },
            { path: 'users', component: () => import('./views/Users.vue'), meta: { roles: ['admin'] } },

        ]
    },
    // Add more routes
    { path: '/:pathMatch(.*)*', component: NotFound },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();

    // Wait for auth check (if token exists but user not loaded)
    if (authStore.token && !authStore.user) {
        try {
            await authStore.fetchUser();
        } catch (e) {
            // Token invalid
        }
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.meta.guest && authStore.isAuthenticated) {
        next('/');
    } else {
        // Role check
        const requiredRoles = to.meta.roles as string[] | undefined;
        if (requiredRoles) {
            const userRole = authStore.user?.role;
            if (!userRole || !requiredRoles.includes(userRole)) {
                // Unauthorized
                return next('/');
            }
        }
        next();
    }
});

export default router;
