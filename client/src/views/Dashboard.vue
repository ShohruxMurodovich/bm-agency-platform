<template>
  <div class="space-y-8 animate-fade-in">
       <!-- Header -->
       <div>
         <h1 class="text-3xl font-bold tracking-tight text-slate-900">
             {{ getGreeting() }}, {{ authStore.user?.name?.split(' ')[0] || 'User' }}
         </h1>
         <p class="text-slate-500 mt-2">{{ getRoleDescription() }}</p>
       </div>

       <!-- Stats Grid -->
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

       <!-- Role Specific Content -->
       <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <!-- Main Activity Feed / Table -->
           <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <div>
                       <h3 class="font-bold text-slate-900">{{ mainSectionTitle }}</h3>
                       <p class="text-xs text-slate-500 mt-0.5">{{ mainSectionSubtitle }}</p>
                   </div>
                   <button v-if="mainSectionAction" @click="$router.push(mainSectionAction.path)" class="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
                       {{ mainSectionAction.label }}
                   </button>
               </div>
               
               <!-- Placeholder for specific role content -->
               <div class="p-8 text-center" v-if="loading">
                   <Loader2 class="w-8 h-8 animate-spin mx-auto text-slate-300" />
                   <p class="text-slate-500 mt-2">Loading data...</p>
               </div>
               
               <div v-else class="overflow-x-auto">
                   <!-- Admin/Seller: Recent Orders style -->
                   <table class="w-full text-sm text-left" v-if="!authStore.isCourier">
                       <thead class="text-xs text-slate-400 uppercase bg-white border-b border-slate-50">
                           <tr>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.id') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.item') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('dashboard.table.status') }}</th>
                               <th class="px-6 py-4 font-medium text-right">{{ t('dashboard.table.amount') }}</th>
                           </tr>
                       </thead>
                       <tbody class="divide-y divide-slate-50">
                           <tr v-for="item in recentItems" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                               <td class="px-6 py-4 font-medium text-slate-900">#{{ item.id }}</td>
                               <td class="px-6 py-4 text-slate-600">{{ item.name }}</td>
                               <td class="px-6 py-4">
                                   <span :class="getStatusColor(item.status)" class="px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                                       {{ t('status.' + item.status) }}
                                   </span>
                               </td>
                               <td class="px-6 py-4 font-medium text-slate-900 text-right">{{ item.amount }}</td>
                           </tr>
                       </tbody>
                   </table>

                   <!-- Courier: Tasks style -->
                   <div v-else class="divide-y divide-slate-50">
                        <div v-for="task in recentItems" :key="task.id" class="p-4 flex items-center justify-between hover:bg-slate-50/50">
                            <div class="flex items-center gap-4">
                                <div class="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                    <Package class="w-5 h-5" />
                                </div>
                                <div>
                                    <p class="font-medium text-slate-900">{{ task.name }}</p>
                                    <p class="text-xs text-slate-500">{{ t('dashboard.table.from') }}: {{ task.source }}</p>
                                </div>
                            </div>
                            <span :class="getStatusColor(task.status)" class="px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                                {{ t('status.' + task.status) }}
                            </span>
                        </div>
                   </div>
               </div>
           </div>

           <!-- Quick Actions / Secondary Stats -->
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

               <!-- System/Platform Status (for everyone) -->
               <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                   <h3 class="font-bold text-slate-900 mb-4">{{ t('dashboard.sections.platform_health') }}</h3>
                   <div class="space-y-4">
                       <div class="flex items-center justify-between text-sm">
                           <span class="text-slate-500 flex items-center">
                               <div class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                               {{ t('dashboard.health.system') }}
                           </span>
                           <span class="font-medium text-emerald-600">{{ t('status.operational') }}</span>
                       </div>
                       <div class="flex items-center justify-between text-sm">
                           <span class="text-slate-500 flex items-center">
                               <div class="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                               {{ t('settings.database') }}
                           </span>
                           <span class="font-medium text-slate-900">{{ t('status.connected') }}</span>
                       </div>
                        <div class="flex items-center justify-between text-sm">
                           <span class="text-slate-500 flex items-center">
                               <div class="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                               {{ t('dashboard.health.version') }}
                           </span>
                           <span class="font-medium text-slate-900">v2.4.0</span>
                       </div>
                   </div>
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
    DollarSign, 
    ShoppingBag, 
    Package, 
    Users, 
    TrendingUp, 
    TrendingDown,
    Truck,
    CheckSquare,
    Inbox,
    CornerUpLeft,
    Plus,
    Loader2
} from 'lucide-vue-next';

const { t } = useI18n();
const authStore = useAuthStore();
const loading = ref(true);

// Mock Data
const recentItems = ref<any[]>([]);

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

const fetchedStats = ref({
    revenue: '$0.00',
    active_orders: '0',
    pending_orders: '0',
    returns: '0',
    total_products: '0',
    active_sellers: '0',
    pending_pickups: '0',
    active_deliveries: '0',
    returns_process: '0',
    completed_jobs: '0'
});

// Computed configuration based on role
const currentStats = computed(() => {
    if (authStore.isCourier) {
        return [
             { label: t('dashboard.stats.pending_pickups'), value: fetchedStats.value.pending_pickups, color: 'indigo', icon: Inbox, trend: 0 },
             { label: t('dashboard.stats.active_deliveries'), value: fetchedStats.value.active_deliveries, color: 'blue', icon: Truck, trend: 0 },
             { label: t('dashboard.stats.returns_process'), value: fetchedStats.value.returns_process, color: 'orange', icon: CornerUpLeft, trend: 0 },
             { label: t('dashboard.stats.completed_jobs'), value: fetchedStats.value.completed_jobs, color: 'emerald', icon: CheckSquare, trend: 0 },
        ];
    }
    if (authStore.isSeller) {
        return [
             { label: t('dashboard.stats.revenue'), value: fetchedStats.value.revenue, color: 'indigo', icon: DollarSign, trend: 0 },
             { label: t('dashboard.stats.active_orders'), value: fetchedStats.value.active_orders, color: 'blue', icon: Package, trend: 0 },
             { label: t('dashboard.stats.pending_orders'), value: fetchedStats.value.pending_orders, color: 'orange', icon: ShoppingBag, trend: 0 },
             { label: t('dashboard.stats.returns'), value: fetchedStats.value.returns, color: 'rose', icon: CornerUpLeft, trend: 0 },
        ];
    }
    // Admin default
    return [
         { label: t('dashboard.stats.revenue'), value: fetchedStats.value.revenue, color: 'indigo', icon: DollarSign, trend: 0 },
         { label: t('dashboard.stats.active_orders'), value: fetchedStats.value.active_orders, color: 'blue', icon: ShoppingBag, trend: 0 },
         { label: t('dashboard.stats.total_products'), value: fetchedStats.value.total_products, color: 'orange', icon: Package, trend: 0 },
         { label: t('dashboard.stats.active_sellers'), value: fetchedStats.value.active_sellers, color: 'rose', icon: Users, trend: 0 },
    ];
});

const mainSectionTitle = computed(() => {
    if (authStore.isCourier) return t('dashboard.sections.recent_activity');
    return t('dashboard.sections.recent_orders');
});

const mainSectionSubtitle = computed(() => {
    if (authStore.isCourier) return t('dashboard.sections.recent_activity_subtitle');
    return t('dashboard.sections.recent_orders_subtitle');
});

const mainSectionAction = computed(() => {
    if (authStore.isCourier) return { label: t('dashboard.actions.view_all_tasks'), path: '/receive-products' };
    if (authStore.isSeller) return { label: t('dashboard.actions.view_all_orders'), path: '/orders' };
    return { label: t('dashboard.actions.view_all_orders'), path: '/orders' };
});

const quickActions = computed(() => {
    if (authStore.isCourier) {
        return [
            { label: t('menu.receive_products'), path: '/receive-products', icon: Inbox },
            { label: t('menu.return_products'), path: '/return-products', icon: CornerUpLeft },
        ];
    }
    if (authStore.isSeller) {
        return [
            { label: t('menu.send_products'), path: '/send-products', icon: Truck },
            { label: t('menu.accept_returns'), path: '/accept-returns', icon: CheckSquare },
            { label: t('dashboard.quick_actions.add_product'), path: '/products/new', icon: Plus },
        ];
    }
    // Admin
    return [
        { label: t('dashboard.quick_actions.manage_users'), path: '/users', icon: Users },
        { label: t('menu.send_products'), path: '/send-products', icon: Truck },
        { label: t('menu.stores'), path: '/stores', icon: Package },
    ];
});

// Real data fetch
const loadDashboardData = async () => {
    try {
        const { data } = await api.get('/dashboard/stats');
        
        // Update stats values if provided
        if (data.stats) {
            applyStats(data.stats);
        }
        
        // Update recent items
        if (data.recent_items) {
            recentItems.value = data.recent_items;
        }
    } catch (e) {
        console.error('Failed to load dashboard data', e);
    }
};

const applyStats = (stats: any) => {
    // We update the 'value' property of the currentStats computed items
    // Since currentStats is computed, we can't mutate it directly.
    // Instead, we'll store the values in a reactive object and use them in the computed
    
    // Map backend keys to our internal stat keys
    // Admin
    if (stats.revenue_value) fetchedStats.value.revenue = stats.revenue_value;
    if (stats.active_orders_value) fetchedStats.value.active_orders = stats.active_orders_value;
    if (stats.total_products_value) fetchedStats.value.total_products = stats.total_products_value;
    if (stats.active_sellers_value) fetchedStats.value.active_sellers = stats.active_sellers_value;
    
    // Seller
    if (stats.pending_orders_value) fetchedStats.value.pending_orders = stats.pending_orders_value;
    if (stats.returns_value) fetchedStats.value.returns = stats.returns_value;
    
    // Courier
    if (stats.pending_pickups_value) fetchedStats.value.pending_pickups = stats.pending_pickups_value;
    if (stats.active_deliveries_value) fetchedStats.value.active_deliveries = stats.active_deliveries_value;
    if (stats.returns_process_value) fetchedStats.value.returns_process = stats.returns_process_value;
    if (stats.completed_jobs_value) fetchedStats.value.completed_jobs = stats.completed_jobs_value;
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
