<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Analytics Dashboard</h1>
      <p class="text-sm text-slate-500 mt-1">Overview of your business performance</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-indigo-600" />
    </div>

    <!-- Dashboard Widgets -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Orders -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Orders</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ analytics.orders.total }}</p>
            <p class="text-sm text-slate-500 mt-1">{{ analytics.orders.this_month }} this month</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShoppingCart class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div v-if="analytics.orders.pending > 0" class="mt-4 pt-4 border-t border-slate-100">
          <p class="text-sm text-amber-600 font-medium">{{ analytics.orders.pending }} pending orders</p>
        </div>
      </div>

      <!-- Total Revenue -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Revenue</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">${{ formatNumber(analytics.revenue.total) }}</p>
            <p class="text-sm text-slate-500 mt-1">${{ formatNumber(analytics.revenue.this_month) }} this month</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
            <DollarSign class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Total Products -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-500 uppercase tracking-wide">Products</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">{{ analytics.inventory.total_products }}</p>
            <p class="text-sm text-slate-500 mt-1">{{ analytics.inventory.total_stock }} units in stock</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
            <Package class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div v-if="analytics.inventory.low_stock_items > 0" class="mt-4 pt-4 border-t border-slate-100">
          <p class="text-sm text-red-600 font-medium">{{ analytics.inventory.low_stock_items }} low stock items</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div class="space-y-2">
          <router-link to="/parent-products" class="block p-3 bg-white/80 hover:bg-white rounded-lg transition-colors">
            <div class="flex items-center text-sm font-medium text-slate-700">
              <Plus class="w-4 h-4 mr-2 text-indigo-600" />
              Create Product
            </div>
          </router-link>
          <router-link to="/stores" class="block p-3 bg-white/80 hover:bg-white rounded-lg transition-colors">
            <div class="flex items-center text-sm font-medium text-slate-700">
              <Store class="w-4 h-4 mr-2 text-indigo-600" />
              Manage Stores
            </div>
          </router-link>
          <router-link to="/orders" class="block p-3 bg-white/80 hover:bg-white rounded-lg transition-colors">
            <div class="flex items-center text-sm font-medium text-slate-700">
              <ShoppingBag class="w-4 h-4 mr-2 text-indigo-600" />
              View Orders
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Additional Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Performance Summary -->
      <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <span class="text-sm text-slate-600">Average Order Value</span>
            </div>
            <span class="text-sm font-semibold text-slate-900">
              ${{ averageOrderValue }}
            </span>
          </div>
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-blue-500"></div>
              <span class="text-sm text-slate-600">Stock Turnover Rate</span>
            </div>
            <span class="text-sm font-semibold text-slate-900">
              {{ stockTurnoverRate }}%
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-purple-500"></div>
              <span class="text-sm text-slate-600">Fulfillment Rate</span>
            </div>
            <span class="text-sm font-semibold text-slate-900">
              {{ fulfillmentRate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Getting Started Guide -->
      <div class="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
        <h3 class="text-lg font-semibold text-slate-900 mb-4">Getting Started</h3>
        
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900">Connect your stores</p>
              <p class="text-xs text-slate-600 mt-0.5">Link your marketplace accounts to sync products</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900">Create parent products</p>
              <p class="text-xs text-slate-600 mt-0.5">Build your unified product catalog</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900">Map marketplace products</p>
              <p class="text-xs text-slate-600 mt-0.5">Link marketplace SKUs to parent products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { Loader2, ShoppingCart, DollarSign, Package, Plus, Store, ShoppingBag } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const loading = ref(true);
const analytics = ref({
  orders: { total: 0, this_month: 0, pending: 0 },
  revenue: { total: 0, this_month: 0, currency: 'USD' },
  inventory: { total_products: 0, total_stock: 0, low_stock_items: 0 }
});

const fetchAnalytics = async () => {
  try {
    loading.value = true;
    const { data } = await api.get('/analytics/overview');
    analytics.value = data;
  } catch (e) {
    console.error('Failed to load analytics', e);
    toast.error('Failed to load analytics data');
  } finally {
    loading.value = false;
  }
};

const averageOrderValue = computed(() => {
  if (analytics.value.orders.total === 0) return '0.00';
  const avg = analytics.value.revenue.total / analytics.value.orders.total;
  return avg.toFixed(2);
});

const stockTurnoverRate = computed(() => {
  // Simple mock calculation for MVP
  if (analytics.value.inventory.total_stock === 0) return 0;
  return Math.min(95, Math.round((analytics.value.orders.total / analytics.value.inventory.total_stock) * 100));
});

const fulfillmentRate = computed(() => {
  // Simple mock calculation for MVP
  if (analytics.value.orders.total === 0) return 100;
  return Math.max(85, 100 - Math.round((analytics.value.orders.pending / analytics.value.orders.total) * 100));
});

const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  fetchAnalytics();
});
</script>
