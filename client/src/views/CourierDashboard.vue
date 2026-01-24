<template>
  <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('courier.dashboard.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('courier.dashboard.subtitle') }}</p>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Orders in Work Card -->
          <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 border-l-amber-500">
              <div class="p-6">
                  <h2 class="text-lg font-semibold text-foreground mb-4">{{ t('courier.dashboard.orders_in_work') }}</h2>
                  <div class="space-y-2">
                      <div class="flex justify-between items-center">
                          <span class="text-sm text-muted-foreground">{{ t('courier.dashboard.pending') }}:</span>
                          <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ ordersInWork.pending }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                          <span class="text-sm text-muted-foreground">{{ t('courier.dashboard.processing') }}:</span>
                          <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ ordersInWork.processing }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                          <span class="text-sm text-muted-foreground">{{ t('courier.dashboard.ready') }}:</span>
                          <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{ ordersInWork.ready }}</span>
                      </div>
                  </div>
                  <Button class="w-full mt-4" variant="outline" @click="navigateToOrders">
                      {{ t('courier.dashboard.view_orders') }} →
                  </Button>
              </div>
          </div>

          <!-- Pending Receives Card -->
          <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 border-l-green-500">
              <div class="p-6">
                  <h2 class="text-lg font-semibold text-foreground mb-4">{{ t('courier.dashboard.pending_receives') }}</h2>
                  <div class="text-center py-4">
                      <div class="text-5xl font-bold text-green-600 dark:text-green-400">{{ pendingReceives }}</div>
                      <div class="text-sm text-muted-foreground mt-2">{{ t('courier.dashboard.items_awaiting') }}</div>
                  </div>
                  <Button class="w-full mt-4" variant="outline" @click="navigateToReceives">
                      {{ t('courier.dashboard.view_receives') }} →
                  </Button>
              </div>
          </div>
      </div>

      <!-- Active Acts Card -->
      <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 border-l-blue-500">
          <div class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">{{ t('courier.dashboard.active_acts') }}</h2>
              <div class="space-y-3">
                  <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                          <span class="text-sm font-medium text-foreground">{{ t('courier.dashboard.transfer_acts') }}</span>
                          <span class="ml-2 text-sm text-muted-foreground">{{ activeActs.transfer }} {{ t('courier.dashboard.active') }}</span>
                      </div>
                      <Button size="sm" variant="ghost" @click="navigateToTransferActs">
                          {{ t('common.view') }} →
                      </Button>
                  </div>
                  <div class="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                          <span class="text-sm font-medium text-foreground">{{ t('courier.dashboard.return_acts') }}</span>
                          <span class="ml-2 text-sm text-muted-foreground">{{ activeActs.return }} {{ t('courier.dashboard.active') }}</span>
                      </div>
                      <Button size="sm" variant="ghost" @click="navigateToReturnActs">
                          {{ t('common.view') }} →
                      </Button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Recent Movements Card -->
      <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden border-l-4 border-l-purple-500">
          <div class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">{{ t('courier.dashboard.recent_movements') }} ({{ t('courier.dashboard.last_10') }})</h2>
              <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                      <thead class="text-xs text-muted-foreground uppercase border-b border-border">
                          <tr>
                              <th class="px-4 py-2 text-left font-medium">{{ t('courier.movements.time') }}</th>
                              <th class="px-4 py-2 text-left font-medium">{{ t('courier.movements.product') }}</th>
                              <th class="px-4 py-2 text-left font-medium">{{ t('courier.movements.route') }}</th>
                              <th class="px-4 py-2 text-left font-medium">{{ t('courier.movements.qty') }}</th>
                              <th class="px-4 py-2 text-left font-medium">{{ t('courier.movements.type') }}</th>
                          </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                          <tr v-for="movement in recentMovements" :key="movement.id" class="hover:bg-muted/50 cursor-pointer" @click="navigateToMovement(movement.id)">
                              <td class="px-4 py-3 text-muted-foreground">{{ formatTime(movement.occurred_at) }}</td>
                              <td class="px-4 py-3 font-mono text-xs text-foreground">{{ movement.parent_product?.sku }}</td>
                              <td class="px-4 py-3 text-muted-foreground">
                                  {{ movement.from_location?.name }} → {{ movement.to_location?.name }}
                              </td>
                              <td class="px-4 py-3 font-medium text-foreground">{{ movement.quantity }}</td>
                              <td class="px-4 py-3">
                                  <span class="text-xs text-muted-foreground">{{ formatMovementType(movement.movement_type) }}</span>
                              </td>
                          </tr>
                          <tr v-if="recentMovements.length === 0">
                              <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                                  {{ t('courier.dashboard.no_recent_movements') }}
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              <Button class="w-full mt-4" variant="outline" @click="navigateToAllMovements">
                  {{ t('courier.dashboard.view_all_movements') }} →
              </Button>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import api from '../api';
import Button from '../components/ui/Button.vue';

const { t } = useI18n();
const router = useRouter();

// Dashboard data
const ordersInWork = ref({
    pending: 0,
    processing: 0,
    ready: 0
});
const pendingReceives = ref(0);
const activeActs = ref({
    transfer: 0,
    return: 0
});
const recentMovements = ref<any[]>([]);

// Format time to HH:MM
const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Format movement type
const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ');
};

// Navigation methods
const navigateToOrders = () => {
    router.push('/orders');
};

const navigateToReceives = () => {
    router.push('/receive-products');
};

const navigateToTransferActs = () => {
    router.push('/orders?filter=transfer_acts');
};

const navigateToReturnActs = () => {
    router.push('/return-products?filter=active');
};

const navigateToAllMovements = () => {
    router.push('/product-movements');
};

const navigateToMovement = (id: string) => {
    router.push(`/product-movements?highlight=${id}`);
};

// Fetch dashboard data
const fetchDashboardData = async () => {
    try {
        // Fetch orders by status
        const { data: allOrders } = await api.get('/orders');
        ordersInWork.value = {
            pending: allOrders.filter((o: any) => o.status === 'pending').length,
            processing: allOrders.filter((o: any) => o.status === 'processing').length,
            ready: allOrders.filter((o: any) => ['ready_for_pickup', 'ready_to_ship'].includes(o.status)).length
        };

        // TODO: Fetch pending receives when endpoint is available
        pendingReceives.value = 8; // Mock data

        // TODO: Fetch active acts when endpoint is available
        activeActs.value = {
            transfer: 4, // Mock data
            return: 2 // Mock data
        };

        // Fetch recent movements
        const { data: movements } = await api.get('/product-movement/movements');
        recentMovements.value = movements.slice(0, 10); // Take only first 10
    } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
    }
};

onMounted(() => {
    fetchDashboardData();
});
</script>
