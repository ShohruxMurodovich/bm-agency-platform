<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('courier.movements.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('courier.movements.subtitle') }}</p>
          </div>
          <Button variant="outline" @click="exportMovements">
               <Download class="w-4 h-4 mr-2" />
               {{ t('common.export') }}
          </Button>
      </div>

      <!-- Filters -->
      <div class="bg-slate-50 rounded-xl p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.movements.product') }}</label>
                  <input 
                      v-model="filters.product" 
                      type="text" 
                      :placeholder="t('courier.movements.search_sku')"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.movements.type') }}</label>
                  <select v-model="filters.type" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option value="SELLER_TO_BM">{{ t('courier.movements.types.seller_to_bm') }}</option>
                      <option value="BM_TO_MARKETPLACE">{{ t('courier.movements.types.bm_to_marketplace') }}</option>
                      <option value="MARKETPLACE_SALE">{{ t('courier.movements.types.marketplace_sale') }}</option>
                      <option value="CUSTOMER_RETURN">{{ t('courier.movements.types.customer_return') }}</option>
                      <option value="BM_TO_SELLER">{{ t('courier.movements.types.bm_to_seller') }}</option>
                  </select>
              </div>
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.movements.location') }}</label>
                  <select v-model="filters.location" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all') }}</option>
                      <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                  </select>
              </div>
              <div>
                  <label class="text-xs font-medium text-slate-600 mb-1 block">{{ t('courier.movements.date_range') }}</label>
                  <input 
                      v-model="filters.dateFrom" 
                      type="date" 
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
          </div>
          <div class="flex gap-2">
              <Button size="sm" variant="outline" @click="clearFilters">{{ t('common.clear_filters') }}</Button>
          </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.time') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.product') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.route') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.status') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.qty') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.type') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('courier.movements.by') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="movement in filteredMovements" :key="movement.id" class="hover:bg-slate-50/50 transition-colors cursor-pointer" @click="viewMovement(movement)">
                      <td class="px-6 py-4 text-slate-600">{{ formatDateTime(movement.occurred_at) }}</td>
                      <td class="px-6 py-4 font-mono text-xs text-slate-900">{{ movement.parent_product?.sku || 'N/A' }}</td>
                      <td class="px-6 py-4 text-slate-600">
                          <span class="inline-flex items-center gap-1">
                              {{ movement.from_location?.name || 'N/A' }}
                              <ArrowRight class="w-3 h-3" />
                              {{ movement.to_location?.name || 'N/A' }}
                          </span>
                      </td>
                      <td class="px-6 py-4">
                          <span class="inline-flex items-center gap-1 text-xs">
                              <span :class="getStatusBadgeColor(movement.from_status?.name)" class="px-2 py-0.5 rounded-full">
                                  {{ movement.from_status?.name || 'N/A' }}
                              </span>
                              <ArrowRight class="w-3 h-3" />
                              <span :class="getStatusBadgeColor(movement.to_status?.name)" class="px-2 py-0.5 rounded-full">
                                  {{ movement.to_status?.name || 'N/A' }}
                              </span>
                          </span>
                      </td>
                      <td class="px-6 py-4 font-medium text-slate-900">{{ movement.quantity }}</td>
                      <td class="px-6 py-4 text-slate-600">{{ formatMovementType(movement.movement_type) }}</td>
                      <td class="px-6 py-4">
                          <span :class="movement.initiator_type === 'USER' ? 'text-indigo-600' : 'text-slate-500'" class="text-xs">
                              {{ movement.initiator_type === 'USER' ? '👤 User' : '⚙️ System' }}
                          </span>
                      </td>
                  </tr>
                   <tr v-if="filteredMovements.length === 0">
                      <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                          {{ t('courier.movements.no_movements') }}
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <!-- Pagination -->
      <div class="flex justify-between items-center">
          <div class="text-sm text-slate-600">
              {{ t('common.showing') }} {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalMovements) }} {{ t('common.of') }} {{ totalMovements }} {{ t('courier.movements.movements') }}
          </div>
          <div class="flex gap-2">
              <Button size="sm" variant="outline" @click="previousPage" :disabled="currentPage === 1">
                  ← {{ t('common.previous') }}
              </Button>
              <Button size="sm" variant="outline" @click="nextPage" :disabled="currentPage >= totalPages">
                  {{ t('common.next') }} →
              </Button>
          </div>
      </div>

      <!-- Movement Details Modal -->
      <Dialog 
        :isOpen="!!selectedMovement" 
        :title="t('courier.movements.details_title')" 
        :description="t('courier.movements.details_subtitle')"
        @close="selectedMovement = null"
        @confirm="selectedMovement = null"
      >
        <div v-if="selectedMovement" class="space-y-4">
            <div class="space-y-2">
                <p class="text-xs text-slate-500 font-mono">{{ t('courier.movements.movement_id') }}: {{ selectedMovement.id }}</p>
                <p class="text-xs text-slate-500">{{ t('courier.movements.occurred_at') }}: {{ formatDateTime(selectedMovement.occurred_at) }}</p>
                <p class="text-xs text-slate-500">{{ t('courier.movements.recorded_at') }}: {{ formatDateTime(selectedMovement.recorded_at) }}</p>
            </div>
            
            <div class="border-t border-slate-100 pt-4">
                <p class="text-sm font-medium text-slate-900">{{ t('courier.movements.product') }}: {{ selectedMovement.parent_product?.sku }} - {{ selectedMovement.parent_product?.title }}</p>
                <p class="text-sm text-slate-600">{{ t('courier.movements.quantity') }}: {{ selectedMovement.quantity }} {{ t('common.units') }}</p>
            </div>

            <div class="border-t border-slate-100 pt-4">
                <p class="text-xs font-bold text-slate-700 uppercase mb-2">{{ t('courier.movements.location_movement') }}</p>
                <p class="text-sm text-slate-600">• {{ t('common.from') }}: {{ selectedMovement.from_location?.name }}</p>
                <p class="text-sm text-slate-600">• {{ t('common.to') }}: {{ selectedMovement.to_location?.name }}</p>
            </div>

            <div class="border-t border-slate-100 pt-4">
                <p class="text-xs font-bold text-slate-700 uppercase mb-2">{{ t('courier.movements.status_movement') }}</p>
                <p class="text-sm text-slate-600">• {{ t('common.from') }}: {{ selectedMovement.from_status?.name }}</p>
                <p class="text-sm text-slate-600">• {{ t('common.to') }}: {{ selectedMovement.to_status?.name }}</p>
            </div>

            <div class="border-t border-slate-100 pt-4">
                <p class="text-sm text-slate-600">{{ t('courier.movements.type') }}: {{ formatMovementType(selectedMovement.movement_type) }}</p>
                <p class="text-sm text-slate-600">{{ t('courier.movements.initiator') }}: {{ selectedMovement.initiator_type }}</p>
                <p v-if="selectedMovement.document_id" class="text-sm text-slate-600">{{ t('courier.movements.document_id') }}: {{ selectedMovement.document_id }}</p>
                <p v-if="selectedMovement.comment" class="text-sm text-slate-600 mt-2">{{ t('courier.movements.comment') }}: {{ selectedMovement.comment }}</p>
            </div>
        </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Dialog from '../components/ui/Dialog.vue';
import { Download, ArrowRight } from 'lucide-vue-next';

const { t } = useI18n();
const route = useRoute();

const movements = ref<any[]>([]);
const locations = ref<any[]>([]);
const selectedMovement = ref<any>(null);
const currentPage = ref(1);
const pageSize = 50;

const filters = ref({
    product: '',
    type: '',
    location: '',
    dateFrom: ''
});

// Computed
const filteredMovements = computed(() => {
    let filtered = movements.value;

    if (filters.value.product) {
        filtered = filtered.filter(m => 
            m.parent_product?.sku?.toLowerCase().includes(filters.value.product.toLowerCase())
        );
    }

    if (filters.value.type) {
        filtered = filtered.filter(m => m.movement_type === filters.value.type);
    }

    if (filters.value.location) {
        filtered = filtered.filter(m => 
            m.from_location?.id === filters.value.location || 
            m.to_location?.id === filters.value.location
        );
    }

    if (filters.value.dateFrom) {
        const fromDate = new Date(filters.value.dateFrom);
        filtered = filtered.filter(m => new Date(m.occurred_at) >= fromDate);
    }

    // Pagination
    const start = (currentPage.value - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
});

const totalMovements = computed(() => {
    let count = movements.value.length;
    // Apply filters to get accurate count
    if (filters.value.product || filters.value.type || filters.value.location || filters.value.dateFrom) {
        let filtered = movements.value;
        if (filters.value.product) {
            filtered = filtered.filter(m => m.parent_product?.sku?.toLowerCase().includes(filters.value.product.toLowerCase()));
        }
        if (filters.value.type) {
            filtered = filtered.filter(m => m.movement_type === filters.value.type);
        }
        if (filters.value.location) {
            filtered = filtered.filter(m => m.from_location?.id === filters.value.location || m.to_location?.id === filters.value.location);
        }
        if (filters.value.dateFrom) {
            const fromDate = new Date(filters.value.dateFrom);
            filtered = filtered.filter(m => new Date(m.occurred_at) >= fromDate);
        }
        count = filtered.length;
    }
    return count;
});

const totalPages = computed(() => Math.ceil(totalMovements.value / pageSize));

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

const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ');
};

const getStatusBadgeColor = (status: string) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const lower = status.toLowerCase();
    if (lower.includes('good') || lower.includes('stock')) return 'bg-green-100 text-green-700';
    if (lower.includes('ship')) return 'bg-blue-100 text-blue-700';
    if (lower.includes('damaged')) return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
};

const viewMovement = (movement: any) => {
    selectedMovement.value = movement;
};

const clearFilters = () => {
    filters.value = {
        product: '',
        type: '',
        location: '',
        dateFrom: ''
    };
    currentPage.value = 1;
};

const previousPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const exportMovements = () => {
    const headers = ['Time', 'Product', 'From', 'To', 'From Status', 'To Status', 'Qty', 'Type', 'Initiator'];
    const rows = filteredMovements.value.map(m => [
        formatDateTime(m.occurred_at),
        m.parent_product?.sku || 'N/A',
        m.from_location?.name || 'N/A',
        m.to_location?.name || 'N/A',
        m.from_status?.name || 'N/A',
        m.to_status?.name || 'N/A',
        m.quantity,
        formatMovementType(m.movement_type),
        m.initiator_type
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_movements_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Fetch data
const fetchMovements = async () => {
    try {
        const params = new URLSearchParams();
        if (filters.value.product) params.append('product', filters.value.product);
        if (filters.value.type) params.append('type', filters.value.type);
        if (filters.value.location) params.append('location', filters.value.location);
        if (filters.value.dateFrom) params.append('dateFrom', filters.value.dateFrom);

        const { data } = await api.get(`/product-movement/movements?${params.toString()}`);
        movements.value = data;

        // Check for highlight parameter
        const highlightId = route.query.highlight;
        if (highlightId) {
            const movement = movements.value.find(m => m.id === highlightId);
            if (movement) {
                selectedMovement.value = movement;
            }
        }
    } catch (error) {
        console.error('Failed to fetch movements:', error);
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

onMounted(() => {
    fetchMovements();
    fetchLocations();
});
</script>
