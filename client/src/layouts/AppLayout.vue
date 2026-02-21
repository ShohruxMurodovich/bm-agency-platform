<template>
  <div class="flex h-screen bg-background font-sans text-foreground transition-colors duration-300">
    <!-- Sidebar -->
    <aside class="w-64 bg-card border-r border-border flex flex-col transition-all duration-300 fixed h-full z-10">
        <div class="p-6 h-16 flex items-center border-b border-border">
            <!-- Brand -->
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                    P
                </div>
                <h1 class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    {{ t('common.platform') }}
                </h1>
            </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <template v-for="item in navItems" :key="item.label">
                <!-- Header items (non-clickable section labels) -->
                <div v-if="item.isHeader" class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
                    {{ item.label }}
                </div>
                <!-- Navigation links -->
                <router-link v-else :to="item.path" 
                    class="flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group"
                    :class="isActive(item.path) ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                >
                    <component :is="item.icon" class="w-5 h-5 mr-3 transition-colors" :class="isActive(item.path) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'" />
                    {{ item.label }}
                </router-link>
            </template>
        </nav>

        <div class="p-4 border-t border-border bg-muted/30">
            <div class="flex items-center gap-3 mb-4 px-2">
                 <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
                     {{ userInitials }}
                 </div>
                 <div class="flex-1 min-w-0">
                     <p class="text-sm font-medium text-foreground truncate">{{ authStore.user?.name || authStore.user?.email?.split('@')[0] || t('common.user_fallback') }}</p>
                     <p class="text-xs text-muted-foreground truncate">{{ authStore.user?.email }}</p>
                 </div>
            </div>
            <button @click="logout" class="flex w-full items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg shadow-sm hover:bg-muted hover:text-destructive transition-colors">
                <LogOut class="w-4 h-4 mr-2" />
                {{ t('common.sign_out') }}
            </button>
        </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 ml-64 flex flex-col min-h-screen">
        <!-- Header -->
        <header class="h-16 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 px-8 flex items-center justify-between">
             <div class="flex items-center gap-2 text-sm">
                 <template v-for="(crumb, index) in currentBreadcrumbs" :key="index">
                     <span :class="index === currentBreadcrumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'">
                         {{ crumb }}
                     </span>
                     <span v-if="index < currentBreadcrumbs.length - 1" class="text-muted-foreground">/</span>
                 </template>
             </div>
             <div class="flex items-center gap-4 relative">
                 <LanguageSwitcher />
                 <ThemeToggle />
                 <!-- Notification Dropdown -->
                 <div class="relative">
                     <button @click="toggleNotifications" class="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
                         <Bell class="w-5 h-5" />
                         <span v-if="notifications.length > 0" class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                     </button>

                     <div v-if="isNotificationsOpen" class="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border py-2 z-50 origin-top-right animate-fade-in">
                         <div class="px-4 py-2 border-b border-border flex justify-between items-center">
                             <h3 class="text-sm font-semibold text-foreground">{{ t('common.notifications') }}</h3>
                             <button @click="isNotificationsOpen = false" class="text-muted-foreground hover:text-foreground">
                                 <X class="w-4 h-4" />
                             </button>
                         </div>
                         <div class="max-h-96 overflow-y-auto">
                             <div v-if="notifications.length === 0" class="p-8 text-center text-muted-foreground flex flex-col items-center">
                                 <Bell class="w-8 h-8 text-muted-foreground/50 mb-2" />
                                 <p class="text-sm">{{ t('common.no_new_notifications') }}</p>
                             </div>
                             <div v-else>
                                 <div v-for="note in notifications" :key="note.id" class="px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 cursor-pointer">
                                     <div class="flex justify-between items-start">
                                         <p class="text-sm font-medium text-foreground" :class="{ 'text-primary': note.unread }">{{ note.title }}</p>
                                         <span class="text-xs text-muted-foreground whitespace-nowrap ml-2">{{ note.time }}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-8 overflow-y-auto bg-background">
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
import ThemeToggle from '../components/ThemeToggle.vue';
import { useAuthStore } from '../stores/auth';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Users, 
    LogOut, 
    X, 
    Store,
    Package,
    Truck,
    CheckSquare,
    Inbox,
    CornerUpLeft,
    Bell,
    BarChart3,
    FileText,
    Settings,
    Search
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
    
    // ========================================
    // COURIER ROLE - Different navigation
    // ========================================
    if (authStore.isCourier) {
        items.push(
            { label: t('menu.overview'), isHeader: true },
            { label: t('courier.dashboard.title'), path: '/courier-dashboard', icon: LayoutDashboard },
            { label: t('menu.operations'), isHeader: true },
            { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
            { label: t('menu.receive_products'), path: '/receive-products', icon: Inbox },
            { label: t('menu.return_products'), path: '/return-products', icon: CornerUpLeft },
            { label: t('courier.states.title'), path: '/product-states', icon: Package },
            { label: t('productTracking.title'), path: '/product-tracking', icon: Search },
            { label: t('menu.notifications'), path: '/notifications', icon: Bell },
            { label: t('menu.settings'), path: '/settings', icon: Settings }
        );
        return items;
    }
    
    // ========================================
    // PUBLIC_USER ROLE - SaaS User Navigation
    // ========================================
    if (authStore.user?.role === 'public_user') {
        items.push(
            { label: t('menu.overview'), isHeader: true },
            { label: t('menu.dashboard'), path: '/', icon: LayoutDashboard },
            { label: t('menu.product_management'), isHeader: true },
            { label: t('menu.stores'), path: '/stores', icon: Store },
            { label: t('menu.parent_products'), path: '/parent-products', icon: Package },
            { label: t('menu.marketplace_products'), path: '/marketplace-products', icon: ShoppingCart },
            { label: t('menu.operations'), isHeader: true },
            { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
            { label: t('menu.inventory_mgmt'), path: '/inventory', icon: Inbox },
            { label: t('courier.states.title'), path: '/product-states', icon: Package },
            { label: t('productTracking.title'), path: '/product-tracking', icon: Search },
            { label: t('menu.account'), isHeader: true },
            { label: t('menu.subscription'), path: '/subscription', icon: FileText }
        );
        return items;
    }
    
    // ========================================
    // SELLER ROLE
    // ========================================
    if (authStore.isSeller) {
        items.push(
            { label: t('menu.overview'), isHeader: true },
            { label: t('menu.dashboard'), path: '/', icon: LayoutDashboard },
            { label: t('menu.inventory'), isHeader: true },
            { label: t('menu.parent_products'), path: '/products', icon: Package },
            { label: t('menu.sales'), isHeader: true },
            { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
            { label: t('menu.stock_management'), isHeader: true },
            { label: t('menu.send_products'), path: '/send-products', icon: Truck },
            { label: t('menu.accept_returns'), path: '/accept-returns', icon: CheckSquare },
            { label: t('productTracking.title'), path: '/product-tracking', icon: Search },
            { label: t('menu.analytics'), path: '/analytics', icon: BarChart3 },
            { label: t('menu.notifications'), path: '/notifications', icon: Bell },
            { label: t('menu.settings'), path: '/settings', icon: Settings }
        );
        return items;
    }
    
    // ========================================
    // ADMIN (SUPER ADMIN) ROLE
    // ========================================
    if (authStore.isAdmin) {
        items.push(
            { label: t('menu.overview'), isHeader: true },
            { label: t('menu.dashboard'), path: '/', icon: LayoutDashboard },
            { label: t('menu.administration'), isHeader: true },
            { label: t('menu.sellers'), path: '/sellers', icon: Users },
            { label: t('menu.users_roles'), path: '/users', icon: Users },
            { label: t('menu.stores'), path: '/stores', icon: Store },
            { label: t('menu.inventory'), isHeader: true },
            { label: t('menu.parent_products'), path: '/products', icon: Package },
            { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
            { label: t('menu.inventory_mgmt'), path: '/inventory', icon: Inbox },
            { label: t('marketplace_products.title'), path: '/marketplace-products', icon: ShoppingCart },
            { label: t('courier.states.title'), path: '/product-states', icon: Package },
            { label: t('productTracking.title'), path: '/product-tracking', icon: Search },
            { label: t('menu.logistics'), isHeader: true },
            { label: t('menu.transfer_acts'), path: '/transfer-acts', icon: FileText },
            { label: t('menu.return_acts'), path: '/return-acts', icon: FileText },
            { label: t('menu.reporting'), isHeader: true },
            { label: t('menu.analytics'), path: '/analytics', icon: BarChart3 },
            { label: t('menu.notifications'), path: '/notifications', icon: Bell },
            { label: t('menu.settings'), path: '/settings', icon: Settings }
        );
        return items;
    }
    
    // ========================================
    // STAFF (ADMIN/EMPLOYEE) ROLE
    // ========================================
    // Staff has same access as Admin but WITHOUT Users menu
    items.push(
        { label: t('menu.overview'), isHeader: true },
        { label: t('menu.dashboard'), path: '/', icon: LayoutDashboard },
        { label: t('menu.administration'), isHeader: true },
        { label: t('menu.sellers'), path: '/sellers', icon: Users },
        { label: t('menu.stores'), path: '/stores', icon: Store },
        { label: t('menu.inventory'), isHeader: true },
        { label: t('menu.parent_products'), path: '/products', icon: Package },
        { label: t('menu.orders'), path: '/orders', icon: ShoppingCart },
        { label: t('menu.inventory_mgmt'), path: '/inventory', icon: Inbox },
        { label: t('marketplace_products.title'), path: '/marketplace-products', icon: ShoppingCart },
        { label: t('courier.states.title'), path: '/product-states', icon: Package },
        { label: t('productTracking.title'), path: '/product-tracking', icon: Search },
        { label: t('menu.logistics'), isHeader: true },
        { label: t('menu.transfer_acts'), path: '/transfer-acts', icon: FileText },
        { label: t('menu.return_acts'), path: '/return-acts', icon: FileText },
        { label: t('menu.reporting'), isHeader: true },
        { label: t('menu.analytics'), path: '/analytics', icon: BarChart3 },
        { label: t('menu.notifications'), path: '/notifications', icon: Bell },
        { label: t('menu.settings'), path: '/settings', icon: Settings }
    );
    
    return items;
});

const logout = () => {
    authStore.logout();
};

const userInitials = computed(() => {
    const name = authStore.user?.name || authStore.user?.email || t('common.user_fallback');
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
    return [t('common.platform')];
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
