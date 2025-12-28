<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('inventory.title') }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ t('inventory.subtitle') }}</p>
      </div>

      <!-- Header Filters (Context) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm" v-if="authStore.isAdmin || authStore.isStaff">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-slate-700 min-w-[80px]">{{ t('common.seller') }}:</label>
                  <select v-model="selectedSeller" @change="fetchInventory" class="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all_sellers') }}</option>
                      <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                  </select>
              </div>
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-slate-700 min-w-[80px]">{{ t('common.store') }}:</label>
                  <select v-model="selectedStore" @change="fetchInventory" class="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all_stores') }}</option>
                      <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.store_name }}</option>
                  </select>
              </div>
          </div>
      </div>

      <!-- Filter Row -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.product') }}</label>
                  <div class="relative">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input :placeholder="t('common.search_products')" class="pl-9" v-model="productSearch" @keyup.enter="fetchInventory" />
                  </div>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.stock_status') }}</label>
                  <select v-model="stockStatus" @change="fetchInventory" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option value="in_stock">{{ t('inventory.in_stock') }}</option>
                      <option value="low_stock">{{ t('inventory.low_stock') }}</option>
                      <option value="out_of_stock">{{ t('inventory.out_of_stock') }}</option>
                  </select>
              </div>
          </div>
      </div>

      <!-- Inventory Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-slate-500">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('inventory.loading') }}
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">{{ error }}</div>
          <div v-else-if="inventory.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <Package class="w-8 h-8 text-slate-300 mb-3" />
              <h3 class="text-lg font-medium text-slate-900">{{ t('inventory.no_items') }}</h3>
          </div>
          <table v-else class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('table.product_name') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('table.seller') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('table.stock') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('table.last_updated') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in inventory" :key="item.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-medium text-slate-900">
                          {{ item.parent_product?.product_name || '—' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600">
                          {{ item.seller?.name || '—' }}
                      </td>
                      <td class="px-6 py-4">
                          <!-- Inline Editable Stock -->
                          <div v-if="editingItemId === item.id" class="flex items-center gap-2">
                              <input 
                                type="number" 
                                v-model.number="editingValue"
                                @keyup.enter="saveStock(item)"
                                @keyup.esc="cancelEdit"
                                min="0"
                                class="w-24 h-8 px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                ref="stockInput"
                              />
                              <button @click="saveStock(item)" class="p-1 hover:bg-green-50 rounded text-green-600">
                                  <Check class="w-4 h-4" />
                              </button>
                              <button @click="cancelEdit" class="p-1 hover:bg-red-50 rounded text-red-600">
                                  <X class="w-4 h-4" />
                              </button>
                          </div>
                          <div v-else @click="startEdit(item)" class="cursor-pointer group flex items-center gap-2">
                              <span 
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="getStockClass(item.stock)"
                              >
                                  {{ item.quantity || 0 }}
                              </span>
                              <Pencil class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                      </td>
                      <td class="px-6 py-4 text-slate-500 text-xs">
                          {{ item.updated_at ? formatDate(item.updated_at) : '—' }}
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Input from '../components/ui/Input.vue';
import { Search, Loader2, Package, Pencil, Check, X } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const authStore = useAuthStore();

// Header Filter State
const selectedSeller = ref('');
const selectedStore = ref('');
const sellers = ref<any[]>([]);
const stores = ref<any[]>([]);

// Filter Row State
const productSearch = ref('');
const stockStatus = ref('');

// Inventory State
const inventory = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

// Inline Edit State
const editingItemId = ref<number | null>(null);
const editingValue = ref<number>(0);
const stockInput = ref<HTMLInputElement | null>(null);

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

// Fetch inventory
const fetchInventory = async () => {
    try {
        loading.value = true;
        const params: any = {};
        
        if (selectedSeller.value) params.seller_id = selectedSeller.value;
        if (selectedStore.value) params.store_id = selectedStore.value;
        if (productSearch.value) params.search = productSearch.value;
        if (stockStatus.value) params.stock_status = stockStatus.value;
        
        const { data } = await api.get('/inventory', { params });
        inventory.value = data;
        error.value = '';
    } catch (e) {
        error.value = 'Failed to load inventory';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// Inline editing functions
const startEdit = (item: any) => {
    editingItemId.value = item.id;
    editingValue.value = item.quantity || 0;
    nextTick(() => {
        if (stockInput.value) {
            stockInput.value.focus();
            stockInput.value.select();
        }
    });
};

const cancelEdit = () => {
    editingItemId.value = null;
    editingValue.value = 0;
};

const saveStock = async (item: any) => {
    // Validate: only integers, no negatives
    if (!Number.isInteger(editingValue.value) || editingValue.value < 0) {
        toast.error('Stock must be a positive integer');
        return;
    }

    try {
        // Backend should create a product_movements record with type=ADJUSTMENT
        await api.put(`/inventory/${item.id}`, { quantity: editingValue.value });
        
        // Update local state
        const index = inventory.value.findIndex(i => i.id === item.id);
        if (index !== -1) {
            inventory.value[index].quantity = editingValue.value;
            inventory.value[index].updated_at = new Date().toISOString();
        }
        
        toast.success('Stock updated');
        cancelEdit();
    } catch (e) {
        toast.error('Failed to update stock');
        console.error(e);
    }
};

// Helper functions
const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
};

const getStockClass = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
};

onMounted(async () => {
    await fetchSellers();
    await fetchStores();
    await fetchInventory();
});
</script>
