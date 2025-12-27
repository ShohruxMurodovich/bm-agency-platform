<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('courier.states.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('courier.states.subtitle') }}</p>
          </div>
          <Button variant="outline" @click="exportStates">
               <Download class="w-4 h-4 mr-2" />
               {{ t('common.export') }}
          </Button>
      </div>

      <!-- Filters -->
      <div class="bg-slate-50 rounded-xl p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.states.product') }}</label>
                  <input 
                      v-model="filters.product" 
                      type="text" 
                      :placeholder="t('courier.states.search_sku')"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.states.location') }}</label>
                  <select v-model="filters.location" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                  </select>
              </div>
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.states.status') }}</label>
                  <select v-model="filters.status" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="status in statuses" :key="status.id" :value="status.id">{{ status.code }}</option>
                  </select>
              </div>
          </div>
          <div class="flex gap-3 items-center">
              <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input v-model="filters.showZeroQty" type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  {{ t('courier.states.show_zero_qty') }}
              </label>
              <Button size="sm" variant="outline" @click="clearFilters">{{ t('common.clear_filters') }}</Button>
          </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('courier.states.product') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.states.location') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.states.status') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.states.qty') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.states.last_updated') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('common.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="state in filteredStates" :key="state.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4">
                          <div class="font-mono text-xs font-medium text-slate-900">{{ state.parent_product?.sku }}</div>
                          <div class="text-xs text-slate-500">{{ state.parent_product?.title }}</div>
                      </td>
                      <td class="px-6 py-4 text-slate-600">{{ state.location?.name }}</td>
                      <td class="px-6 py-4">
                          <span :class="getStatusBadgeColor(state.business_status?.code)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {{ state.business_status?.code }}
                          </span>
                      </td>
                      <td class="px-6 py-4">
                          <span :class="state.quantity > 100 ? 'font-bold text-slate-900' : 'text-slate-600'">
                              {{ state.quantity }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 text-xs">{{ formatRelativeTime(state.updated_at) }}</td>
                      <td class="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" @click="viewState(state)">{{ t('common.view') }}</Button>
                      </td>
                  </tr>
                   <tr v-if="filteredStates.length === 0">
                      <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                          {{ t('courier.states.no_states') }}
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <!-- Summary Row -->
      <div class="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
          <div class="text-sm font-bold text-slate-700">
              {{ t('courier.states.total_products') }}: {{ totalProducts }}
          </div>
          <div class="text-sm font-bold text-slate-700">
              {{ t('courier.states.total_quantity') }}: {{ totalQuantity }} {{ t('common.units') }}
          </div>
      </div>

      <!-- State Details Modal -->
      <Dialog 
        :isOpen="!!selectedState" 
        :title="t('courier.states.details_title')" 
        :description="t('courier.states.details_subtitle')"
        @close="selectedState = null"
        @confirm="selectedState = null"
      >
        <div v-if="selectedState" class="space-y-4">
            <div class="space-y-2">
                <p class="text-sm font-medium text-slate-900">{{ t('courier.states.product') }}: {{ selectedState.parent_product?.sku }} - {{ selectedState.parent_product?.title }}</p>
                <p class="text-sm text-slate-600">{{ t('courier.states.location') }}: {{ selectedState.location?.name }}</p>
                <p class="text-sm text-slate-600">
                    {{ t('courier.states.status') }}: 
                    <span :class="getStatusBadgeColor(selectedState.business_status?.code)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-1">
                        {{ selectedState.business_status?.code }}
                    </span>
                </p>
            </div>
            
            <div class="border-t border-slate-100 pt-4">
                <p class="text-lg font-bold text-slate-900">{{ t('courier.states.current_quantity') }}: {{ selectedState.quantity }} {{ t('common.units') }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ t('courier.states.last_updated') }}: {{ formatDateTime(selectedState.updated_at) }}</p>
                <p v-if="selectedState.last_movement_id" class="text-xs text-slate-500 font-mono">{{ t('courier.states.last_movement_id') }}: {{ selectedState.last_movement_id }}</p>
            </div>

            <div class="border-t border-slate-100 pt-4">
                <p class="text-xs font-bold text-slate-700 uppercase mb-3">{{ t('courier.states.recent_movements') }} ({{ t('courier.states.last_5') }})</p>
                <div class="bg-slate-50 rounded-lg overflow-hidden">
                    <table class="w-full text-xs">
                        <thead class="text-xs text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                                <th class="px-3 py-2 text-left font-medium">{{ t('courier.movements.time') }}</th>
                                <th class="px-3 py-2 text-left font-medium">{{ t('courier.movements.type') }}</th>
                                <th class="px-3 py-2 text-left font-medium">{{ t('courier.movements.route') }}</th>
                                <th class="px-3 py-2 text-left font-medium">{{ t('courier.states.qty_change') }}</th>
                                <th class="px-3 py-2 text-left font-medium">{{ t('courier.states.new_total') }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            <tr v-for="movement in recentMovements" :key="movement.id">
                                <td class="px-3 py-2 text-slate-600">{{ formatTime(movement.occurred_at) }}</td>
                                <td class="px-3 py-2 text-slate-600">{{ formatMovementType(movement.movement_type) }}</td>
                                <td class="px-3 py-2 text-slate-600">{{ movement.from_location?.name }} → {{ movement.to_location?.name }}</td>
                                <td class="px-3 py-2 font-medium" :class="movement.qty_change > 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ movement.qty_change > 0 ? '+' : '' }}{{ movement.qty_change }}
                                </td>
                                <td class="px-3 py-2 font-medium text-slate-900">{{ movement.new_total }}</td>
                            </tr>
                            <tr v-if="recentMovements.length === 0">
                                <td colspan="5" class="px-3 py-4 text-center text-slate-500">
                                    {{ t('courier.states.no_recent_movements') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="border-t border-slate-100 pt-4 flex gap-2">
                <Button variant="outline" size="sm" @click="viewAllMovements">
                    {{ t('courier.states.view_all_movements') }}
                </Button>
                <Button variant="ghost" size="sm" @click="selectedState = null">
                    {{ t('common.close') }}
                </Button>
            </div>
        </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Dialog from '../components/ui/Dialog.vue';
import { Download } from 'lucide-vue-next';

const { t } = useI18n();
const router = useRouter();

const states = ref<any[]>([]);
const locations = ref<any[]>([]);
const statuses = ref<any[]>([]);
const selectedState = ref<any>(null);
const recentMovements = ref<any[]>([]);

const filters = ref({
    product: '',
    location: '',
    status: '',
    showZeroQty: false
});

// Computed
const filteredStates = computed(() => {
    let filtered = states.value;

    if (filters.value.product) {
        filtered = filtered.filter(s => 
            s.parent_product?.sku?.toLowerCase().includes(filters.value.product.toLowerCase()) ||
            s.parent_product?.title?.toLowerCase().includes(filters.value.product.toLowerCase())
        );
    }

    if (filters.value.location) {
        filtered = filtered.filter(s => s.location?.id === filters.value.location);
    }

    if (filters.value.status) {
        filtered = filtered.filter(s => s.business_status?.id === filters.value.status);
    }

    if (!filters.value.showZeroQty) {
        filtered = filtered.filter(s => s.quantity > 0);
    }

    return filtered;
});

const totalProducts = computed(() => {
    const uniqueProducts = new Set(filteredStates.value.map(s => s.parent_product?.id));
    return uniqueProducts.size;
});

const totalQuantity = computed(() => {
    return filteredStates.value.reduce((sum, s) => sum + s.quantity, 0);
});

// Methods
const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('courier.states.just_now');
    if (diffInHours < 24) return `${diffInHours}h ${t('courier.states.ago')}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return t('courier.states.yesterday');
    return `${diffInDays}d ${t('courier.states.ago')}`;
};

const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ').substring(0, 4);
};

const getStatusBadgeColor = (status: string) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const lower = status.toLowerCase();
    if (lower.includes('good') || lower.includes('stock')) return 'bg-green-100 text-green-700';
    if (lower.includes('ship')) return 'bg-blue-100 text-blue-700';
    if (lower.includes('damaged')) return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
};

const viewState = async (state: any) => {
    selectedState.value = state;
    
    try {
        // Fetch recent movements for this product at this location
        const params = new URLSearchParams();
        params.append('product', state.parent_product?.id || state.parent_product_id);
        params.append('location', state.location?.id || state.location_id);
        
        const { data } = await api.get(`/product-movement/movements?${params.toString()}`);
        // Take last 5 movements
        recentMovements.value = data.slice(0, 5).map((m: any) => ({
            ...m,
            qty_change: m.to_location?.id === state.location?.id ? m.quantity : -m.quantity,
            new_total: state.quantity
        }));
    } catch (error) {
        console.error('Failed to fetch recent movements:', error);
        recentMovements.value = [];
    }
};

const viewAllMovements = () => {
    if (selectedState.value) {
        router.push(`/product-movements?product=${selectedState.value.parent_product?.sku}`);
        selectedState.value = null;
    }
};

const clearFilters = () => {
    filters.value = {
        product: '',
        location: '',
        status: '',
        showZeroQty: false
    };
};

const exportStates = () => {
    const headers = ['Product SKU', 'Product Title', 'Location', 'Status', 'Quantity', 'Last Updated'];
    const rows = filteredStates.value.map(s => [
        s.parent_product?.sku || 'N/A',
        s.parent_product?.title || 'N/A',
        s.location?.name || 'N/A',
        s.business_status?.code || 'N/A',
        s.quantity,
        formatDateTime(s.updated_at)
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_states_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Fetch data
const fetchStates = async () => {
    try {
        const params = new URLSearchParams();
        if (filters.value.product) params.append('product', filters.value.product);
        if (filters.value.location) params.append('location', filters.value.location);
        if (filters.value.status) params.append('status', filters.value.status);
        if (filters.value.showZeroQty) params.append('showZeroQty', 'true');

        const { data } = await api.get(`/product-states?${params.toString()}`);
        states.value = data;
    } catch (error) {
        console.error('Failed to fetch states:', error);
    }
};

const fetchLocations = async () => {
    try {
        const { data } = await api.get('/locations');
        locations.value = data;
    } catch (error) {
        console.error('Failed to fetch locations:', error);
    }
};

const fetchStatuses = async () => {
    try {
        const { data } = await api.get('/business-statuses');
        statuses.value = data;
    } catch (error) {
        console.error('Failed to fetch statuses:', error);
    }
};

onMounted(() => {
    fetchStates();
    fetchLocations();
    fetchStatuses();
});
</script>
