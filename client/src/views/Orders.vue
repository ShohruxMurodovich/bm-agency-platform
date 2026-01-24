<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('orders.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('orders.subtitle') }}</p>
      </div>

      <!-- Header Filters (Context) -->
      <div class="bg-card p-4 rounded-xl border border-border shadow-sm" v-if="authStore.isAdmin || authStore.isStaff">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-foreground min-w-[80px]">{{ t('common.seller') }}:</label>
                  <select v-model="selectedSeller" @change="fetchOrders" class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_sellers') }}</option>
                      <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                  </select>
              </div>
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-foreground min-w-[80px]">{{ t('common.store') }}:</label>
                  <select v-model="selectedStore" @change="fetchOrders" class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_stores') }}</option>
                      <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.store_name }}</option>
                  </select>
              </div>
          </div>
      </div>

      <!-- Filter Row (Data filters) -->
      <div class="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.status') }}</label>
                  <select v-model="filterStatus" @change="fetchOrders" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_statuses') }}</option>
                      <option value="pending">{{ t('status.pending') }}</option>
                      <option value="processing">{{ t('status.processing') }}</option>
                      <option value="shipped">{{ t('status.shipped') }}</option>
                      <option value="delivered">{{ t('status.delivered') }}</option>
                      <option value="cancelled">{{ t('status.cancelled') }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_from') }}</label>
                  <input type="date" v-model="dateFrom" @change="fetchOrders" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_to') }}</label>
                  <input type="date" v-model="dateTo" @change="fetchOrders" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.product') }}</label>
                  <div class="relative">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input :placeholder="t('common.search_by_sku_title')" class="pl-9" v-model="productSearch" @keyup.enter="fetchOrders" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Orders List with Expandable Rows -->
      <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-muted-foreground">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('orders.loading') }}
          </div>
          <div v-else-if="error" class="p-8 text-center text-destructive">{{ error }}</div>
          <div v-else-if="orders.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart class="w-8 h-8 text-muted-foreground/50 mb-3" />
              <h3 class="text-lg font-medium text-foreground">{{ t('orders.no_orders') }}</h3>
          </div>
          <div v-else class="divide-y divide-border">
              <!-- Order Row -->
              <div v-for="order in orders" :key="order.id" class="hover:bg-muted/50 transition-colors">
                  <!-- Main Row -->
                  <div class="flex items-center px-6 py-4 cursor-pointer" @click="toggleOrder(order.id)">
                      <div class="flex-1 grid grid-cols-6 gap-4 text-sm">
                          <div class="font-medium text-foreground">#{{ order.id }}</div>
                          <div class="text-muted-foreground">{{ formatDate(order.created_at) }}</div>
                          <div class="text-muted-foreground">{{ order.store?.store_name || '—' }}</div>
                          <div>
                              <span 
                                :class="getStatusClass(order.status)" 
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                              >
                                  {{ t('status.' + order.status) }}
                              </span>
                          </div>
                          <div class="text-foreground font-medium">{{ order.items_count || 0 }} items</div>
                          <div class="text-foreground font-bold">{{ formatCurrency(order.total_amount) }}</div>
                      </div>
                      <button class="ml-4 p-2 hover:bg-muted rounded-lg transition-colors">
                          <ChevronDown 
                            :class="{ 'rotate-180': expandedOrders.has(order.id) }" 
                            class="w-5 h-5 text-muted-foreground transition-transform duration-200" 
                          />
                      </button>
                  </div>

                  <!-- Expanded Items -->
                  <div v-if="expandedOrders.has(order.id)" class="bg-muted/30 px-6 py-4 border-t border-border">
                      <div class="text-xs font-semibold text-muted-foreground uppercase mb-3">{{ t('orders.order_items') }}</div>
                      <div class="bg-card rounded-lg overflow-hidden border border-border">
                          <table class="w-full text-sm">
                              <thead class="bg-muted/50 text-xs text-muted-foreground uppercase">
                                  <tr>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.sku_name') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.price') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.quantity') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.store') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.status') }}</th>
                                  </tr>
                              </thead>
                              <tbody class="divide-y divide-border">
                                  <tr v-for="item in order.items" :key="item.id" class="hover:bg-muted/50">
                                      <td class="px-4 py-3 text-foreground">{{ item.sku_name || item.product_name }}</td>
                                      <td class="px-4 py-3 text-foreground">{{ formatCurrency(item.price) }}</td>
                                      <td class="px-4 py-3 text-muted-foreground">{{ item.quantity }}</td>
                                      <td class="px-4 py-3 text-muted-foreground">{{ order.store?.store_name || '—' }}</td>
                                      <td class="px-4 py-3">
                                          <span 
                                            :class="getStatusClass(item.status || order.status)" 
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                                          >
                                              {{ t('status.' + (item.status || order.status)) }}
                                          </span>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Input from '../components/ui/Input.vue';
import { Search, Loader2, ShoppingCart, ChevronDown } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

// Header Filter State
const selectedSeller = ref('');
const selectedStore = ref('');
const sellers = ref<any[]>([]);
const stores = ref<any[]>([]);

// Filter Row State
const filterStatus = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const productSearch = ref('');

// Orders State
const orders = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

// Expanded orders tracking
const expandedOrders = ref(new Set<number>());

// Fetch sellers
const fetchSellers = async () => {
    if (!authStore.isAdmin && !authStore.isStaff) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        console.error('Failed to load sellers', e);
    }
};

// Fetch stores
const fetchStores = async () => {
    if (!authStore.isAdmin && !authStore.isStaff) return;
    try {
        const { data } = await api.get('/stores');
        stores.value = data;
    } catch (e) {
        console.error('Failed to load stores', e);
    }
};

// Fetch orders
const fetchOrders = async () => {
    try {
        loading.value = true;
        const params: any = {};
        
        if (selectedSeller.value) params.seller_id = selectedSeller.value;
        if (selectedStore.value) params.store_id = selectedStore.value;
        if (filterStatus.value) params.status = filterStatus.value;
        if (dateFrom.value) params.date_from = dateFrom.value;
        if (dateTo.value) params.date_to = dateTo.value;
        if (productSearch.value) params.product_search = productSearch.value;
        
        const { data } = await api.get('/orders', { params });
        orders.value = data;
        error.value = '';
    } catch (e) {
        error.value = 'Failed to load orders';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// Toggle order expansion
const toggleOrder = (orderId: number) => {
    if (expandedOrders.value.has(orderId)) {
        expandedOrders.value.delete(orderId);
    } else {
        expandedOrders.value.add(orderId);
    }
};

// Format helpers
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
};

const formatCurrency = (amount: number | string) => {
    const num = Number(amount);
    if (isNaN(num) || amount === null || amount === undefined) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
        pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        processing: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        shipped: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
        delivered: 'bg-green-500/10 text-green-700 dark:text-green-400',
        cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
    };
    return statusMap[status] || 'bg-muted text-muted-foreground';
};

onMounted(async () => {
    await fetchSellers();
    await fetchStores();
    await fetchOrders();
});
</script>
