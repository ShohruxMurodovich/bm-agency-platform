<template>
  <div class="flex h-screen bg-slate-50 font-sans text-slate-900">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 fixed h-full z-10">
        <div class="p-6 h-16 flex items-center border-b border-slate-100">
            <!-- Brand -->
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    P
                </div>
                <h1 class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
                    Platform
                </h1>
            </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <template v-for="item in navItems" :key="item.path">
                <router-link :to="item.path" 
                    class="flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group"
                    :class="isActive(item.path) ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200/50' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
                >
                    <component :is="item.icon" class="w-5 h-5 mr-3 transition-colors" :class="isActive(item.path) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'" />
                    {{ item.label }}
                </router-link>
            </template>
        </nav>

        <div class="p-4 border-t border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-3 mb-4 px-2">
                 <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold border border-indigo-200">
                     {{ userInitials }}
                 </div>
                 <div class="flex-1 min-w-0">
                     <p class="text-sm font-medium text-slate-900 truncate">{{ authStore.user?.name || 'Admin User' }}</p>
                     <p class="text-xs text-slate-500 truncate">{{ authStore.user?.email }}</p>
                 </div>
            </div>
            <button @click="logout" class="flex w-full items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-red-600 transition-colors">
                <LogOut class="w-4 h-4 mr-2" />
                Sign out
            </button>
        </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between">
             <div class="flex items-center gap-2 text-sm">
                 <template v-for="(crumb, index) in currentBreadcrumbs" :key="index">
                     <span :class="index === currentBreadcrumbs.length - 1 ? 'font-semibold text-slate-800' : 'text-slate-500'">
                         {{ crumb }}
                     </span>
                     <span v-if="index < currentBreadcrumbs.length - 1" class="text-slate-300">/</span>
                 </template>
             </div>
             <div class="flex items-center gap-4 relative">
                 <LanguageSwitcher />
                 <!-- Notification Dropdown -->
                 <div class="relative">
                     <button @click="toggleNotifications" class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
                         <Bell class="w-5 h-5" />
                         <span v-if="notifications.length > 0" class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                     </button>

                     <div v-if="isNotificationsOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 origin-top-right animate-fade-in">
                         <div class="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                             <h3 class="text-sm font-semibold text-slate-900">Notifications</h3>
                             <button @click="isNotificationsOpen = false" class="text-slate-400 hover:text-slate-600">
                                 <X class="w-4 h-4" />
                             </button>
                         </div>
                         <div class="max-h-96 overflow-y-auto">
                             <div v-if="notifications.length === 0" class="p-8 text-center text-slate-500 flex flex-col items-center">
                                 <Bell class="w-8 h-8 text-slate-200 mb-2" />
                                 <p class="text-sm">No new notifications</p>
                             </div>
                             <div v-else>
                                 <div v-for="note in notifications" :key="note.id" class="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
                                     <div class="flex justify-between items-start">
                                         <p class="text-sm font-medium text-slate-900" :class="{ 'text-indigo-600': note.unread }">{{ note.title }}</p>
                                         <span class="text-xs text-slate-400 whitespace-nowrap ml-2">{{ note.time }}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-8 overflow-y-auto">
            <div class="max-w-7xl mx-auto">
                 <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import { useAuthStore } from '../stores/auth';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Users, 
    Settings, 
    LogOut, 
    X, 
    Store,
    Package,
    Truck,
    CheckSquare,
    Inbox,
    CornerUpLeft,
    Bell
} from 'lucide-vue-next';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();

const isNotificationsOpen = ref(false);
const notifications = ref<any[]>([]);

const toggleNotifications = () => {
    isNotificationsOpen.value = !isNotificationsOpen.value;
};

const navItems = computed(() => {
    const items: any[] = [];
    
    // Courier has completely different navigation
    if (authStore.isCourier) {
        items.push(
            { label: t('menu.overview'), isHeader: true },
            { label: t('courier.dashboard.title'), path: '/courier-dashboard', icon: LayoutDashboard },
            { label: t('menu.operations'), isHeader: true },
            { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
            { label: t('menu.receive_products'), path: '/receive-products', icon: Inbox },
            { label: t('menu.return_products'), path: '/return-products', icon: CornerUpLeft },
            { label: t('courier.movements.title'), path: '/product-movements', icon: Truck },
            { label: t('courier.states.title'), path: '/product-states', icon: Package }
        );
        return items;
    }
    
    // For non-courier roles:
    items.push(
        { 
            label: t('menu.overview'),
            isHeader: true 
        },
        { label: t('menu.dashboard'), path: '/', icon: LayoutDashboard },
    );

    // Parent Products for Admin/Staff only
    if (!authStore.isSeller && !authStore.isCourier) {
        items.push({ 
            label: t('menu.inventory'),
            isHeader: true 
        });
        items.push({ label: t('menu.parent_products'), path: '/products', icon: Package });
    }

    // Product Movement for Seller/Courier/Admin
    if (authStore.isSeller || authStore.isAdmin || authStore.isCourier) {
         const hasInventoryHeader = items.some(i => i.label === t('menu.inventory'));
         if (!hasInventoryHeader) {
             items.push({ label: t('menu.operations'), isHeader: true });
         }
    }

    if (authStore.isSeller || authStore.isAdmin) {
        items.push({ label: t('menu.send_products'), path: '/send-products', icon: Truck });
        items.push({ label: t('menu.accept_returns'), path: '/accept-returns', icon: CheckSquare });
    }
    if (authStore.isCourier || authStore.isAdmin) {
        items.push({ label: t('menu.receive_products'), path: '/receive-products', icon: Inbox });
        items.push({ label: t('menu.return_products'), path: '/return-products', icon: CornerUpLeft });
    }
    
    // Product Movements and States for Admin (for monitoring)
    if (authStore.isAdmin) {
        items.push({ label: t('courier.movements.title'), path: '/product-movements', icon: Truck });
        items.push({ label: t('courier.states.title'), path: '/product-states', icon: Package });
    }

    // Orders for all except courier
    if (!authStore.isCourier) {
        items.push({ label: t('menu.sales'), isHeader: true });
        items.push({ label: t('menu.orders'), path: '/orders', icon: ShoppingCart });
    }

    // Admin has full access
    if (authStore.isAdmin) {
        items.push({ label: t('menu.administration'), isHeader: true });
        items.push(
            { label: t('menu.stores'), path: '/stores', icon: Store },
            { label: t('menu.sellers'), path: '/sellers', icon: Users },
            { label: t('menu.users_roles'), path: '/users', icon: Users },
            { label: t('common.settings'), path: '/settings', icon: Settings }
        );
    } else if (authStore.user?.role === 'seller') {
        // Seller sees own stores

        items.push(
            { label: t('menu.my_stores'), path: '/stores', icon: Store }
        );
    }
    // Staff sees only Dashboard, Products, Orders (Default items)
    
    return items;
});

const logout = () => {
    authStore.logout();
};

const userInitials = computed(() => {
    const name = authStore.user?.name || 'A';
    return name.substring(0, 2).toUpperCase();
});

const currentBreadcrumbs = computed(() => {
    const items = navItems.value;
    let lastHeader = '';
    
    for (const item of items) {
        if (item.isHeader) {
            lastHeader = item.label;
        } else if (item.path && isActive(item.path)) {
            return [lastHeader, item.label].filter(Boolean);
        }
    }
    return ['Platform'];
});

const isActive = (path: string) => {
    if (path === '/') return route.path === '/';
    return route.path.startsWith(path);
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
