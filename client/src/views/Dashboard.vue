<template>
  <div class="space-y-8 animate-fade-in">
       <!-- Header -->
       <div>
         <h1 class="text-3xl font-bold tracking-tight text-slate-900">
             {{ getGreeting() }}, {{ authStore.user?.name?.split(' ')[0] || 'User' }}
         </h1>
         <p class="text-slate-500 mt-2">{{ getRoleDescription() }}</p>
       </div>

       <!-- Top Summary Cards (4 cards for Admin) -->
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <template v-for="(stat, index) in currentStats" :key="index">
               <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                   <div class="flex justify-between items-start">
                       <div>
                           <p class="text-sm font-medium text-slate-500">{{ stat.label }}</p>
                           <h3 class="text-3xl font-bold text-slate-900 mt-2">{{ stat.value }}</h3>
                       </div>
                       <div :class="`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600 group-hover:scale-110 transition-transform`">
                           <component :is="stat.icon" class="w-6 h-6" />
                       </div>
                   </div>
                   <div class="mt-4 flex items-center text-sm" v-if="stat.trend">
                       <span :class="stat.trend > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'" class="font-medium flex items-center px-2 py-0.5 rounded-full">
                           <TrendingUp class="w-3 h-3 mr-1" v-if="stat.trend > 0" />
                           <TrendingDown class="w-3 h-3 mr-1" v-else />
                           {{ Math.abs(stat.trend) }}%
                       </span>
                       <span class="text-slate-400 ml-2">vs last month</span>
                   </div>
               </div>
           </template>
       </div>

       <!-- Main Content Grid -->
       <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" v-if="!authStore.isCourier">
           
           <!-- Recent Orders Block -->
           <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div>
                       <h3 class="font-bold text-slate-900">{{ t('dashboard.sections.recent_orders') }}</h3>
                       <p class="text-xs text-slate-500 mt-0.5">{{ t('dashboard.sections.recent_orders_subtitle') }}</p>
                   </div>
                   <button @click="$router.push('/orders')" class="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                       {{ t('dashboard.actions.view_all_orders') }}
                   </button>
               </div>
               
               <div class="p-8 text-center" v-if="loading">
                   <Loader2 class="w-8 h-8 animate-spin mx-auto text-slate-300" />
                   <p class="text-slate-500 mt-2">Loading data...</p>
               </div>
               
               <div v-else class="overflow-x-auto">
                   <table class="w-full text-sm text-left">
                       <thead class="text-xs text-slate-400 uppercase bg-white border-b border-slate-50">
                           <tr>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.id') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.store') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.status') }}</th>
                               <th class="px-6 py-4 font-medium text-right">{{ t('dashboard.table.amount') }}</th>
                           </tr>
                       </thead>
                       <tbody class="divide-y divide-slate-50">
                           <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-slate-50/50 transition-colors">
                               <td class="px-6 py-4 font-medium text-slate-900">#{{ order.id }}</td>
                               <td class="px-6 py-4 text-slate-600">{{ order.store_name }}</td>
                               <td class="px-6 py-4">
                                   <span :class="getStatusColor(order.status)" class="px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                                       {{ t('status.' + order.status) }}
                                   </span>
                               </td>
                               <td class="px-6 py-4 font-medium text-slate-900 text-right">{{ formatCurrency(order.total_amount) }}</td>
                           </tr>
                       </tbody>
                   </table>
               </div>
           </div>

           <!-- Quick Actions / Secondary Info -->
           <div class="space-y-6">
               <!-- Quick Actions Card -->
               <div class="bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 p-6 text-white overflow-hidden relative">
                   <div class="relative z-10">
                       <h3 class="font-bold text-lg mb-1">{{ t('dashboard.sections.quick_actions') }}</h3>
                       <p class="text-indigo-100 text-sm mb-6">{{ t('dashboard.sections.quick_actions_subtitle') }}</p>
                       
                       <div class="space-y-3">
                           <button v-for="action in quickActions" :key="action.label" 
                                   @click="$router.push(action.path)"
                                   class="w-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors rounded-xl p-3 flex items-center text-sm font-medium backdrop-blur-sm">
                               <component :is="action.icon" class="w-4 h-4 mr-3 text-indigo-100" />
                               {{ action.label }}
                           </button>
                       </div>
                   </div>
                   
                   <!-- Decorative bg patterns -->
                   <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                   <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-500/50 rounded-full blur-2xl"></div>
               </div>

               <!-- Product Movements Preview -->
               <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                   <div class="flex justify-between items-center mb-4">
                       <h3 class="font-bold text-slate-900">{{ t('dashboard.sections.recent_movements') }}</h3>
                       <button @click="$router.push('/product-movements')" class="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                           {{ t('dashboard.actions.view_all_movements') }}
                       </button>
                   </div>
                   <div class="space-y-3">
                       <div v-for="movement in recentMovements" :key="movement.id" class="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                           <div class="flex items-center gap-3">
                               <div class="p-2 bg-indigo-50 rounded-lg">
                                   <Truck class="w-4 h-4 text-indigo-600" />
                               </div>
                               <div>
                                   <p class="text-sm font-medium text-slate-900">{{ movement.product_name }}</p>
                                   <p class="text-xs text-slate-500">{{ movement.type }}</p>
                               </div>
                           </div>
                           <span class="text-xs font-medium text-slate-600">{{ movement.quantity }}</span>
                       </div>
                   </div>
               </div>
           </div>
       </div>

       <!-- Daily Orders Chart -->
       <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" v-if="authStore.isAdmin">
           <div class="flex justify-between items-center mb-6">
               <div>
                   <h3 class="font-bold text-slate-900">{{ t('dashboard.sections.daily_orders_chart') }}</h3>
                   <p class="text-xs text-slate-500 mt-0.5">{{ t('dashboard.sections.daily_orders_subtitle') }}</p>
               </div>
               <button @click="$router.push('/analytics')" class="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                   {{ t('dashboard.actions.view_full_analysis') }}
               </button>
           </div>
           <div class="flex items-end gap-2 h-64">
               <div v-for="(day, index) in dailyOrders" :key="index" class="flex-1 flex flex-col items-center gap-2">
                   <div class="w-full bg-indigo-100 rounded-t-lg hover:bg-indigo-200 transition-colors cursor-pointer relative group"
                        :style="{ height: `${(day.amount / maxDailyAmount) * 100}%` }">
                       <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                           {{ formatCurrency(day.amount) }}
                       </div>
                   </div>
                   <span class="text-xs text-slate-500">{{ day.label }}</span>
               </div>
           </div>
       </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { 
    Users, 
    Store,
    ShoppingBag, 
    Package, 
    TrendingUp, 
    TrendingDown,
    Truck,
    Loader2
} from 'lucide-vue-next';

const { t } = useI18n();
const authStore = useAuthStore();
const loading = ref(true);

// Dashboard data
const recentOrders = ref<any[]>([]);
const recentMovements = ref<any[]>([]);
const dailyOrders = ref<any[]>([]);
const fetchedStats = ref({
    total_sellers: '0',
    total_stores: '0',
    active_orders: '0',
    staff_members: '0',
});

onMounted(() => {
    loadDashboardData().finally(() => {
        loading.value = false;
    });
});

const getGreeting = () => {
    return t('dashboard.welcome');
};

const getRoleDescription = () => {
    if (authStore.isAdmin) return t('dashboard.role_desc.admin');
    if (authStore.isSeller) return t('dashboard.role_desc.seller');
    if (authStore.isCourier) return t('dashboard.role_desc.courier');
    return t('dashboard.role_desc.default');
};

// Admin gets exactly 4 stats per TZ
const currentStats = computed(() => {
    if (authStore.isAdmin) {
        return [
             { label: t('dashboard.stats.total_sellers'), value: fetchedStats.value.total_sellers, color: 'indigo', icon: Users, trend: 0 },
             { label: t('dashboard.stats.total_stores'), value: fetchedStats.value.total_stores, color: 'blue', icon: Store, trend: 0 },
             { label: t('dashboard.stats.active_orders'), value: fetchedStats.value.active_orders, color: 'orange', icon: ShoppingBag, trend: 0 },
             { label: t('dashboard.stats.staff_members'), value: fetchedStats.value.staff_members, color: 'rose', icon: Package, trend: 0 },
        ];
    }
    // Keep existing logic for other roles
    return [];
});

const quickActions = computed(() => {
    if (authStore.isAdmin) {
        return [
            { label: t('dashboard.quick_actions.manage_users'), path: '/users', icon: Users },
            { label: t('menu.stores'), path: '/stores', icon: Store },
            { label: t('menu.sellers'), path: '/sellers', icon: Users },
        ];
    }
    return [];
});

const maxDailyAmount = computed(() => {
    return Math.max(...dailyOrders.value.map(d => d.amount), 1);
});

// Real data fetch
const loadDashboardData = async () => {
    try {
        const { data } = await api.get('/dashboard/stats');
        
        // Update stats
        if (data.stats) {
            fetchedStats.value = {
                total_sellers: data.stats.total_sellers || '0',
                total_stores: data.stats.total_stores || '0',
                active_orders: data.stats.active_orders || '0',
                staff_members: data.stats.staff_members || '0',
            };
        }
        
        // Recent orders
        if (data.recent_orders) {
            recentOrders.value = data.recent_orders;
        }

        // Recent movements
        if (data.recent_movements) {
            recentMovements.value = data.recent_movements;
        }

        // Daily orders chart data
        if (data.daily_orders) {
            dailyOrders.value = data.daily_orders;
        }
    } catch (e) {
        console.error('Failed to load dashboard data', e);
    }
};

const formatCurrency = (amount: number | string) => {
    const num = Number(amount);
    if (isNaN(num) || amount === null || amount === undefined) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const getStatusColor = (status: string) => {
    switch(status) {
        case 'completed': return 'bg-emerald-50 text-emerald-700';
        case 'processing': return 'bg-blue-50 text-blue-700';
        case 'shipped': return 'bg-indigo-50 text-indigo-700';
        case 'pending': return 'bg-amber-50 text-amber-500';
        default: return 'bg-slate-100 text-slate-700';
    }
};
</script>
