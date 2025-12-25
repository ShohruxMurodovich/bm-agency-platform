<template>
  <div class="space-y-6">
    <!-- Summary Section -->
    <div v-if="loadingSummary" class="text-center py-4 text-gray-500">Loading inventory...</div>
    <div v-else-if="summary" class="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Current Inventory
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-indigo-50 rounded-lg p-4 text-center">
          <div class="text-sm text-indigo-600 font-medium mb-1">Total Stock</div>
          <div class="text-3xl font-bold text-indigo-900">{{ summary.totalStock }}</div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-600 font-medium">
            <tr>
              <th class="px-3 py-2">Location</th>
              <th class="px-3 py-2">Type</th>
              <th class="px-3 py-2 text-right">Quantity</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="loc in summary.stockByLocation" :key="loc.location">
              <td class="px-3 py-2 text-gray-900 font-medium">{{ loc.location }}</td>
              <td class="px-3 py-2 text-gray-500">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ formatLocationType(loc.location_type) }}
                </span>
              </td>
              <td class="px-3 py-2 text-right font-bold text-gray-900">{{ loc.qty }}</td>
            </tr>
            <tr v-if="summary.stockByLocation.length === 0">
              <td colspan="3" class="px-3 py-4 text-center text-gray-500">No stock in any location</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- History Section -->
    <div class="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Movement History
        </h3>
        <button @click="fetchHistory" class="text-indigo-600 text-sm hover:text-indigo-800">
            Refresh
        </button>
      </div>

      <div v-if="loadingHistory" class="text-center py-4 text-gray-500">Loading history...</div>
      <div v-else class="overflow-x-auto max-h-[500px] overflow-y-auto">
         <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-gray-600 font-medium sticky top-0">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Type</th>
              <th class="px-3 py-2">From -> To</th>
              <th class="px-3 py-2 text-right">Qty</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">User</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="move in history" :key="move.id" class="hover:bg-gray-50">
              <td class="px-3 py-2 text-gray-500 whitespace-nowrap">
                {{ formatDate(move.recorded_at) }}
              </td>
              <td class="px-3 py-2">
                 <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', getMovementColor(move.movement_type)]">
                    {{ move.movement_type }}
                 </span>
              </td>
              <td class="px-3 py-2 text-gray-700">
                <div class="flex items-center gap-1">
                   <span class="font-medium text-xs">{{ move.from_location?.name || '?' }}</span>
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   <span class="font-medium text-xs">{{ move.to_location?.name || '?' }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right font-bold text-gray-900">
                {{ move.quantity }}
              </td>
              <td class="px-3 py-2">
                 <span v-if="move.resulting_status" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {{ move.resulting_status.code }}
                 </span>
                 <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-3 py-2 text-gray-500 text-xs">
                 {{ move.initiator_type }}
              </td>
            </tr>
            <tr v-if="history.length === 0">
                <td colspan="6" class="px-3 py-4 text-center text-gray-500">No movement history found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { inventoryApi, type InventorySummary, type InventoryMovement } from '../../api/inventory';

const props = defineProps<{
  productId: string;
}>();

const summary = ref<InventorySummary | null>(null);
const history = ref<InventoryMovement[]>([]);
const loadingSummary = ref(false);
const loadingHistory = ref(false);

const formatLocationType = (type: string) => {
    return type.replace(/_/g, ' ');
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
};

const getMovementColor = (type: string) => {
    switch (type) {
        case 'SELLER_TO_BM': return 'bg-green-100 text-green-800';
        case 'BM_TO_MARKETPLACE': return 'bg-blue-100 text-blue-800';
        case 'MARKETPLACE_SALE': return 'bg-indigo-100 text-indigo-800';
        case 'CUSTOMER_RETURN': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const fetchSummary = async () => {
    if (!props.productId) return;
    loadingSummary.value = true;
    try {
        summary.value = await inventoryApi.getSummary(props.productId);
    } catch (e) {
        console.error("Failed to fetch inventory summary", e);
    } finally {
        loadingSummary.value = false;
    }
};

const fetchHistory = async () => {
    if (!props.productId) return;
    loadingHistory.value = true;
    try {
        history.value = await inventoryApi.getHistory(props.productId);
    } catch (e) {
        console.error("Failed to fetch inventory history", e);
    } finally {
        loadingHistory.value = false;
    }
};

onMounted(() => {
    fetchSummary();
    fetchHistory();
});

watch(() => props.productId, () => {
    fetchSummary();
    fetchHistory();
});
</script>
