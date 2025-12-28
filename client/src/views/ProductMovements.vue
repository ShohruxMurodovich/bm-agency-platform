<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('courier.movements.title') }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ t('courier.movements.subtitle') }}</p>
      </div>

      <!-- Header Filter: Seller -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm" v-if="authStore.isAdmin || authStore.isStaff">
          <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700 min-w-[80px]">{{ t('common.seller') }}:</label>
              <select v-model="selectedSeller" @change="fetchMovements" class="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">{{ t('common.all_sellers') }}</option>
                  <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
              </select>
          </div>
      </div>

      <!-- Filter Row -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.parent_product') }}</label>
                  <select v-model="filterProduct" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="product in products" :key="product.id" :value="product.id">{{ product.product_name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.from_location') }}</label>
                  <select v-model="filterFromLocation" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.to_location') }}</label>
                  <select v-model="filterToLocation" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.movement_type') }}</label>
                  <select v-model="filterMovementType" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option value="TRANSFER">{{ t('movements.type.transfer') }}</option>
                      <option value="RETURN">{{ t('movements.type.return') }}</option>
                      <option value="ADJUSTMENT">{{ t('movements.type.adjustment') }}</option>
                      <option value="STATUS_CHANGE">{{ t('movements.type.status_change') }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.initiator') }}</label>
                  <select v-model="filterInitiator" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.date_range') }}</label>
                  <input type="date" v-model="filterDateFrom" @change="fetchMovements" class="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-slate-600">{{ t('common.search') }}</label>
                  <div class="relative">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input :placeholder="t('common.search')" class="pl-9" v-model="searchQuery" @keyup.enter="fetchMovements" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Movements Table (Read-only) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-slate-500">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('courier.movements.loading') }}
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">{{ error }}</div>
          <div v-else-if="movements.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <Truck class="w-8 h-8 text-slate-300 mb-3" />
              <h3 class="text-lg font-medium text-slate-900">{{ t('courier.movements.no_movements') }}</h3>
          </div>
          <div v-else class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                  <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                      <tr>
                          <th class="px-6 py-4 font-medium">{{ t('table.date') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.parent_product') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.from_location') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.to_location') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.quantity') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.movement_type') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.order_id') }}</th>
                          <th class="px-6 py-4 font-medium">{{ t('table.initiator') }}</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                      <tr v-for="movement in movements" :key="movement.id" class="hover:bg-slate-50/50 transition-colors">
                          <td class="px-6 py-4 text-slate-900 text-xs">
                              {{ formatDateTime(movement.occurred_at || movement.recorded_at) }}
                          </td>
                          <td class="px-6 py-4 font-medium text-slate-900">
                              {{ movement.parent_product?.product_name || '—' }}
                          </td>
                          <td class="px-6 py-4 text-slate-600">
                              <div class="flex items-center gap-2">
                                  <MapPin class="w-3 h-3 text-slate-400" />
                                  {{ movement.from_location?.name || '—' }}
                              </div>
                          </td>
                          <td class="px-6 py-4 text-slate-600">
                              <div class="flex items-center gap-2">
                                  <MapPin class="w-3 h-3 text-slate-400" />
                                  {{ movement.to_location?.name || '—' }}
                              </div>
                          </td>
                          <td class="px-6 py-4">
                              <span class="font-medium text-slate-900">{{ movement.quantity }}</span>
                          </td>
                          <td class="px-6 py-4">
                              <span 
                                :class="getMovementTypeClass(movement.movement_type)" 
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase"
                              >
                                  {{ movement.movement_type }}
                              </span>
                          </td>
                          <td class="px-6 py-4 text-slate-600">
                              <span v-if="movement.document_id" class="text-indigo-600 font-medium">#{{ movement.order_id }}</span>
                              <span v-else class="text-slate-400">—</span>
                          </td>
                          <td class="px-6 py-4 text-slate-600">
                              {{ movement.initiator_id || '—' }}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Input from '../components/ui/Input.vue';
import { Search, Loader2, Truck, MapPin } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

// Header Filter State
const selectedSeller = ref('');
const sellers = ref<any[]>([]);

// Filter Row State
const filterProduct = ref('');
const filterFromLocation = ref('');
const filterToLocation = ref('');
const filterMovementType = ref('');
const filterInitiator = ref('');
const filterDateFrom = ref('');
const searchQuery = ref('');

// Dropdown options
const products = ref<any[]>([]);
const locations = ref<any[]>([]);
const users = ref<any[]>([]);

// Movements
const movements = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

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

// Fetch filter options
const fetchFilterOptions = async () => {
    try {
        const [productsRes, locationsRes, usersRes] = await Promise.all([
            api.get('/parent-products'),
            api.get('/locations'),
            api.get('/users'),
        ]);
        products.value = productsRes.data;
        locations.value = locationsRes.data;
        users.value = usersRes.data;
    } catch (e) {
        console.error('Failed to load filter options', e);
    }
};

// Fetch movements
const fetchMovements = async () => {
    try {
        loading.value = true;
        const params: any = {};
        
        if (selectedSeller.value) params.seller_id = selectedSeller.value;
        if (filterProduct.value) params.product_id = filterProduct.value;
        if (filterFromLocation.value) params.from_location_id = filterFromLocation.value;
        if (filterToLocation.value) params.to_location_id = filterToLocation.value;
        if (filterMovementType.value) params.type = filterMovementType.value;
        if (filterInitiator.value) params.initiator_id = filterInitiator.value;
        if (filterDateFrom.value) params.date_from = filterDateFrom.value;
        if (searchQuery.value) params.search = searchQuery.value;
        
        const { data } = await api.get('/product-movement/movements', { params });
        movements.value = data;
        error.value = '';
    } catch (e) {
        error.value = 'Failed to load movements';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// Helper functions
const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString();
};

const getMovementTypeClass = (type: string) => {
    const typeMap: Record<string, string> = {
        TRANSFER: 'bg-blue-50 text-blue-700',
        RETURN: 'bg-amber-50 text-amber-700',
        ADJUSTMENT: 'bg-purple-50 text-purple-700',
        STATUS_CHANGE: 'bg-green-50 text-green-700',
    };
    return typeMap[type] || 'bg-slate-100 text-slate-700';
};

onMounted(async () => {
    await fetchSellers();
    await fetchFilterOptions();
    await fetchMovements();
});
</script>
