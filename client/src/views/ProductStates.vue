<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {{ t('courier.states.title') }}
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <Lock class="w-3 h-3 mr-1" />
            Read-Only
          </span>
        </h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('courier.states.subtitle') }}</p>
      </div>

      <!-- Header Filter: Seller ONLY -->
      <div class="bg-card p-4 rounded-xl border border-border shadow-sm" v-if="authStore.isAdmin || authStore.isStaff">
          <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-foreground min-w-[80px]">{{ t('common.seller') }}:</label>
              <select v-model="selectedSeller" @change="fetchProductStates" class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option value="">{{ t('common.all_sellers') }}</option>
                  <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
              </select>
          </div>
      </div>

      <!-- Filter Row -->
      <div class="bg-card p-4 rounded-xl border border-border shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.parent_product') }}</label>
                  <select v-model="filterProduct" @change="fetchProductStates" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_products') }}</option>
                      <option v-for="product in products" :key="product.id" :value="product.id">{{ product.product_name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.location') }}</label>
                  <select v-model="filterLocation" @change="fetchProductStates" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_locations') }}</option>
                      <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.business_status') }}</label>
                  <select v-model="filterBusinessStatus" @change="fetchProductStates" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_statuses') }}</option>
                      <option v-for="status in businessStatuses" :key="status.id" :value="status.id">{{ status.code.replace(/_/g, ' ') }}</option>
                  </select>
              </div>
              <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium text-muted-foreground">{{ t('common.search') }}</label>
                  <div class="relative">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input :placeholder="t('common.search')" class="pl-9" v-model="searchQuery" @keyup.enter="fetchProductStates" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Grouped/Expandable Product States -->
      <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-muted-foreground">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('courier.states.loading') }}
          </div>
          <div v-else-if="error" class="p-8 text-center text-destructive">{{ error }}</div>
          <div v-else-if="groupedStates.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Package class="w-8 h-8 text-muted-foreground/50 mb-3" />
              <h3 class="text-lg font-medium text-foreground">{{ t('courier.states.no_states') }}</h3>
          </div>
          <div v-else class="divide-y divide-border">
              <!-- Main Row: Parent Product -->
              <div v-for="group in groupedStates" :key="group.product_id" class="hover:bg-muted/50 transition-colors">
                  <div class="flex items-center px-6 py-4 cursor-pointer" @click="toggleGroup(group.product_id)">
                      <div class="flex-1 flex items-center gap-4">
                          <div class="flex-1">
                              <div class="font-medium text-foreground">{{ group.product_name }}</div>
                              <div class="text-xs text-muted-foreground mt-0.5">{{ t('courier.states.product_code') }}: {{ group.product_id }}</div>
                          </div>
                          <div class="flex items-center gap-2">
                              <span class="text-sm text-muted-foreground">{{ t('courier.states.total_quantity') }}:</span>
                              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary">
                                  {{ group.total_quantity }}
                              </span>
                          </div>
                      </div>
                      <button class="ml-4 p-2 hover:bg-muted rounded-lg transition-colors">
                          <ChevronDown 
                            :class="{ 'rotate-180': expandedGroups.has(group.product_id) }" 
                            class="w-5 h-5 text-muted-foreground transition-transform duration-200" 
                          />
                      </button>
                  </div>

                  <!-- Expanded Rows: State Details -->
                  <div v-if="expandedGroups.has(group.product_id)" class="bg-muted/30 px-6 py-4 border-t border-border">
                      <div class="bg-card rounded-lg overflow-hidden border border-border">
                          <table class="w-full text-sm">
                              <thead class="bg-muted/50 text-xs text-muted-foreground uppercase">
                                  <tr>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('common.location') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('common.business_status') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('courier.states.quantity') }}</th>
                                      <th class="px-4 py-3 text-left font-medium">{{ t('table.last_updated') }}</th>
                                  </tr>
                              </thead>
                              <tbody class="divide-y divide-border">
                                  <tr v-for="state in group.states" :key="state.id" class="hover:bg-muted/50">
                                      <td class="px-4 py-3 text-foreground">
                                          <div class="flex items-center gap-2">
                                              <MapPin class="w-4 h-4 text-muted-foreground" />
                                              {{ state.location_name }}
                                          </div>
                                      </td>
                                      <td class="px-4 py-3">
                                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 capitalize">
                                              {{ state.business_status_name }}
                                          </span>
                                      </td>
                                      <td class="px-4 py-3">
                                          <span class="font-medium text-foreground">{{ state.quantity }}</span>
                                      </td>
                                      <td class="px-4 py-3 text-muted-foreground text-xs">
                                          {{ state.updated_at ? formatDate(state.updated_at) : '—' }}
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
import { Search, Loader2, Package, ChevronDown, MapPin, Lock } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const authStore = useAuthStore();

// Header Filter State
const selectedSeller = ref('');
const sellers = ref<any[]>([]);

// Filter Row State
const filterProduct = ref('');
const filterLocation = ref('');
const filterBusinessStatus = ref('');
const searchQuery = ref('');

// Dropdown options
const products = ref<any[]>([]);
const locations = ref<any[]>([]);
const businessStatuses = ref<any[]>([]);

// Product States
const groupedStates = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

// Expanded groups tracking
const expandedGroups = ref(new Set<number>());

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
        // Use public endpoints for PUBLIC_USER
        const isPublicUser = authStore.user?.role === 'public_user';
        const locationsEndpoint = isPublicUser ? '/locations/public' : '/locations';
        const statusesEndpoint = isPublicUser ? '/business-statuses/public' : '/business-statuses';
        
        const [productsRes, locationsRes, statusesRes] = await Promise.all([
            api.get('/parent-products'),
            api.get(locationsEndpoint),
            api.get(statusesEndpoint),
        ]);
        products.value = productsRes.data;
        locations.value = locationsRes.data;
        businessStatuses.value = statusesRes.data;
    } catch (e) {
        console.error('Failed to load filter options', e);
    }
};

// Fetch product states
const fetchProductStates = async () => {
    try {
        loading.value = true;
        const params: any = {};
        
        if (selectedSeller.value) params.seller_id = selectedSeller.value;
        if (filterProduct.value) params.product_id = filterProduct.value;
        if (filterLocation.value) params.location_id = filterLocation.value;
        if (filterBusinessStatus.value) params.business_status_id = filterBusinessStatus.value;
        if (searchQuery.value) params.search = searchQuery.value;
        
        const { data } = await api.get('/product-states', { params });
        
        // Group by parent product
        const grouped = data.reduce((acc: any[], state: any) => {
            const existingGroup = acc.find(g => g.product_id === state.parent_product_id);
            if (existingGroup) {
                existingGroup.states.push(state);
                existingGroup.total_quantity += state.quantity;
            } else {
                acc.push({
                    product_id: state.parent_product_id,
                    product_name: state.parent_product_name,
                    total_quantity: state.quantity,
                    states: [state]
                });
            }
            return acc;
        }, []);
        
        groupedStates.value = grouped;
        error.value = '';
    } catch (e) {
        error.value = 'Failed to load product states';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// Toggle group expansion
const toggleGroup = (productId: number) => {
    if (expandedGroups.value.has(productId)) {
        expandedGroups.value.delete(productId);
    } else {
        expandedGroups.value.add(productId);
    }
};

// Helper functions
const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
};

onMounted(async () => {
    await fetchSellers();
    await fetchFilterOptions();
    await fetchProductStates();
});
</script>
