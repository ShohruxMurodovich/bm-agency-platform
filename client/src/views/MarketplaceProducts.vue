<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ $t('marketplace_products.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ $t('marketplace_products.subtitle') }}</p>
      </div>
      <button @click="exportToExcel" class="btn btn-primary flex items-center gap-2">
        <Download class="w-4 h-4" />
        {{ $t('marketplace_products.actions.export_excel') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-card rounded-xl border border-border p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Store Filter (multi-select) -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('marketplace_products.filters.store') }}
          </label>
          <select
            v-model="filters.store_id"
            class="w-full border border-border rounded-lg p-2 bg-background text-foreground"
          >
            <option value="">{{ $t('common.all') }}</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>

        <!-- Product Status Filter (single-select) -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('marketplace_products.filters.product_status') }}
          </label>
          <select v-model="filters.product_status" class="w-full border border-border rounded-lg p-2 bg-background text-foreground">
            <option value="">{{ $t('common.all') }}</option>
            <option value="in_stock">{{ $t('marketplace_products.product_status_options.in_stock') }}</option>
            <option value="run_out">{{ $t('marketplace_products.product_status_options.run_out') }}</option>
            <option value="archived">{{ $t('marketplace_products.product_status_options.archived') }}</option>
            <option value="blocked">{{ $t('marketplace_products.product_status_options.blocked') }}</option>
          </select>
        </div>

        <!-- Price Status Filter (single-select) -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('marketplace_products.filters.price_status') }}
          </label>
          <select v-model="filters.price_status" class="w-full border border-border rounded-lg p-2 bg-background text-foreground">
            <option value="">{{ $t('common.all') }}</option>
            <option value="profit">{{ $t('marketplace_products.price_status_options.profit') }}</option>
            <option value="low_margin">{{ $t('marketplace_products.price_status_options.low_margin') }}</option>
            <option value="loss">{{ $t('marketplace_products.price_status_options.loss') }}</option>
            <option value="unknown">{{ $t('marketplace_products.price_status_options.unknown') }}</option>
          </select>
        </div>

        <!-- Model Filter (single-select) -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('marketplace_products.filters.model') }}
          </label>
          <select v-model="filters.model" class="w-full border border-border rounded-lg p-2 bg-background text-foreground">
            <option value="auto">{{ $t('marketplace_products.model_options.auto') }}</option>
            <option value="fbs">{{ $t('marketplace_products.model_options.fbs') }}</option>
            <option value="fbo">{{ $t('marketplace_products.model_options.fbo') }}</option>
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('marketplace_products.filters.search') }}
          </label>
          <input
            v-model="filters.search"
            type="text"
            :placeholder="$t('marketplace_products.filters.search')"
            class="w-full border border-border rounded-lg p-2 bg-background text-foreground"
            @input="debouncedFetch"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Grouped Products Table -->
    <div v-else-if="groups.length > 0" class="bg-card rounded-xl border border-border overflow-hidden">
      <table class="w-full">
        <thead class="bg-muted border-b border-border">
          <tr>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.id') }}</th>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.title') }}</th>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.variants_count') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.sell_price') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.marketplace_payout') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.profit') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.margin') }}</th>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('marketplace_products.columns.status') }}</th>
            <th class="p-4"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groups" :key="group.product_id">
            <!-- Group Head Row -->
            <tr
              @click="toggleGroup(group.product_id)"
              class="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <td class="p-4 text-foreground">{{ group.product_id }}</td>
              <td class="p-4 text-foreground">{{ group.product_title }}</td>
              <td class="p-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {{ group.variants_count }} {{ $t('marketplace_products.columns.variants') }}
                </span>
              </td>
              <td class="p-4 text-right text-foreground">
                {{ formatCurrency(group.sell_price_min) }} - {{ formatCurrency(group.sell_price_max) }}
              </td>
              <td class="p-4 text-right text-foreground">
                {{ formatCurrency(group.payout_min) }} - {{ formatCurrency(group.payout_max) }}
              </td>
              <td class="p-4 text-right text-foreground">
                <div>{{ formatCurrency(group.profit_min) }} - {{ formatCurrency(group.profit_max) }}</div>
                <div class="text-xs text-muted-foreground mt-1">
                  Min: <span :class="getStatusColor(group.worst_status)">{{ formatCurrency(group.min_profit) }}</span>
                </div>
              </td>
              <td class="p-4 text-right text-foreground">
                <span v-if="group.margin_min !== null && group.margin_max !== null">
                  {{ group.margin_min.toFixed(2) }}% - {{ group.margin_max.toFixed(2) }}%
                </span>
                <span v-else>-</span>
              </td>
              <td class="p-4">
                <span :class="['px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(group.worst_status)]">
                  {{ $t(`marketplace_products.status.${group.worst_status}`) }}
                </span>
              </td>
              <td class="p-4">
                <ChevronRight
                  :class="['w-5 h-5 text-muted-foreground transition-transform', expandedGroups.has(group.product_id) ? 'rotate-90' : '']"
                />
              </td>
            </tr>

            <!-- Variant Rows (Expanded) -->
            <template v-if="expandedGroups.has(group.product_id)">
              <!-- Loading variants -->
              <tr v-if="loadingVariants.has(group.product_id)" class="bg-muted/30">
                <td colspan="9" class="p-4 text-center text-muted-foreground">
                  Loading variants...
                </td>
              </tr>

              <!-- Variant rows -->
              <template v-else-if="groupVariants.get(group.product_id)">
                <tr
                  v-for="variant in groupVariants.get(group.product_id)"
                  :key="variant.sku_id"
                  class="bg-muted/30 border-b border-border"
                >
                  <td class="p-4 pl-8 text-sm text-muted-foreground">{{ variant.sku_id }}</td>
                  <td class="p-4 text-sm text-foreground">{{ variant.title }}</td>
                  <td class="p-4"></td>
                  <td class="p-4 text-right text-sm text-foreground">{{ formatCurrency(variant.sell_price_uzs) }}</td>
                  <td class="p-4 text-right text-sm text-foreground">{{ formatCurrency(variant.payout_uzs) }}</td>
                  <td class="p-4 text-right text-sm text-foreground">{{ formatCurrency(variant.profit_uzs) }}</td>
                  <td class="p-4 text-right text-sm relative group">
                    <span :class="getStatusColor(variant.status)">
                      {{ variant.margin_percent !== null ? variant.margin_percent.toFixed(2) + '%' : '-' }}
                    </span>
                    <!-- Tooltip -->
                    <div
                      v-if="variant.hint"
                      class="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg whitespace-nowrap z-10 border border-border"
                    >
                      {{ $t(`marketplace_products.hints.${getHintKey(variant.hint)}`) || variant.hint }}
                    </div>
                  </td>
                  <td class="p-4">
                    <span :class="['px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadgeClass(variant.status)]">
                      {{ $t(`marketplace_products.status.${variant.status}`) }}
                    </span>
                  </td>
                  <td class="p-4"></td>
                </tr>
              </template>
            </template>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="p-4 border-t border-border flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Showing {{ ((page - 1) * per_page) + 1 }} - {{ Math.min(page * per_page, total) }} of {{ total }} groups
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span class="text-sm text-foreground">Page {{ page }}</span>
          <button
            @click="nextPage"
            :disabled="page * per_page >= total"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-card rounded-xl border border-border p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">No products found</h3>
        <p class="text-muted-foreground text-sm">
          Try adjusting your filters or search query.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ShoppingCart, Download, ChevronRight } from 'lucide-vue-next';
import api from '../api';
// Types
interface ProductGroup {
  product_id: number;
  product_title: string;
  variants_count: number;
  sell_price_min: number;
  sell_price_max: number;
  payout_min: number;
  payout_max: number;
  profit_min: number | null;
  profit_max: number | null;
  margin_min: number | null;
  margin_max: number | null;
  worst_status: string;
  min_profit: number | null;
}

interface ProductVariant {
  sku_id: number;
  sku_name: string | null;
  title: string;
  barcode: number | null;
  sell_price_uzs: number;
  payout_uzs: number;
  profit_uzs: number | null;
  margin_percent: number | null;
  status: string;
  hint?: string;
  commission_percent?: number;
  commission_value_uzs?: number;
  logistics_fee_uzs?: number;
  cost_uzs?: number | null;
  model_used?: string;
  store_id: string;
  product_status: string;
}

interface Store {
  id: string;
  name: string;
}

// State
const loading = ref(false);
const groups = ref<ProductGroup[]>([]);
const total = ref(0);
const page = ref(1);
const per_page = ref(20);
const stores = ref<Store[]>([]);
const expandedGroups = ref(new Set<number>());
const groupVariants = ref(new Map<number, ProductVariant[]>());
const loadingVariants = ref(new Set<number>());

const filters = reactive({
  store_id: '',
  product_status: '',
  price_status: '',
  model: 'auto',
  search: '',
});

// Fetch products with profit analysis
const fetchProfitAnalysis = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: per_page.value.toString(),
    });

    if (filters.store_id) {
      params.append('store_ids[]', filters.store_id);
    }
    if (filters.product_status) params.append('product_status', filters.product_status);
    if (filters.price_status) params.append('price_status', filters.price_status);
    if (filters.model) params.append('model', filters.model);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/marketplace-products/profit-analysis?${params.toString()}`);
    groups.value = response.data.groups;
    total.value = response.data.total;
  } catch (error) {
    console.error('Failed to fetch profit analysis:', error);
  } finally {
    loading.value = false;
  }
};

// Fetch variants for a specific group (lazy loading)
const fetchVariants = async (productId: number) => {
  loadingVariants.value.add(productId);
  try {
    const params = new URLSearchParams();
    if (filters.store_id) {
      params.append('store_ids[]', filters.store_id);
    }
    if (filters.product_status) params.append('product_status', filters.product_status);
    if (filters.price_status) params.append('price_status', filters.price_status);
    if (filters.model) params.append('model', filters.model);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/marketplace-products/profit-analysis/${productId}/variants?${params.toString()}`);
    groupVariants.value.set(productId, response.data);
  } catch (error) {
    console.error('Failed to fetch variants:', error);
  } finally {
    loadingVariants.value.delete(productId);
  }
};

// Toggle group expansion
const toggleGroup = async (productId: number) => {
  if (expandedGroups.value.has(productId)) {
    expandedGroups.value.delete(productId);
  } else {
    expandedGroups.value.add(productId);
    // Fetch variants if not already loaded
    if (!groupVariants.value.has(productId)) {
      await fetchVariants(productId);
    }
  }
};

// Fetch stores
const fetchStores = async () => {
  try {
    const response = await api.get('/stores');
    stores.value = response.data;
  } catch (error) {
    console.error('Failed to fetch stores:', error);
  }
};

// Export to Excel
const exportToExcel = async () => {
  try {
    const params = new URLSearchParams();
    if (filters.store_id) {
      params.append('store_ids[]', filters.store_id);
    }
    if (filters.product_status) params.append('product_status', filters.product_status);
    if (filters.price_status) params.append('price_status', filters.price_status);
    if (filters.model) params.append('model', filters.model);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/marketplace-products/profit-analysis/export?${params.toString()}`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `marketplace-products-profit-${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to export:', error);
  }
};

// Pagination
const prevPage = () => {
  if (page.value > 1) {
    page.value--;
    fetchProfitAnalysis();
  }
};

const nextPage = () => {
  if (page.value * per_page.value < total.value) {
    page.value++;
    fetchProfitAnalysis();
  }
};

// Debounced search
let searchTimeout: number | null = null;
const debouncedFetch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    page.value = 1;
    fetchProfitAnalysis();
  }, 300);
};

// Helper functions
const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' UZS';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PROFIT: 'text-green-600 dark:text-green-400',
    LOSS: 'text-red-600 dark:text-red-400',
    LOW_MARGIN: 'text-orange-600 dark:text-orange-400',
    UNKNOWN: 'text-gray-600 dark:text-gray-400',
  };
  return colors[status] || 'text-gray-600';
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    PROFIT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    LOSS: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    LOW_MARGIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    UNKNOWN: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getHintKey = (hint: string) => {
  const hintMap: Record<string, string> = {
    'Not linked to Parent Product (cost unknown)': 'not_linked',
    'Cost is not set in Parent Products': 'cost_not_set',
    'Sell price is 0': 'sell_price_zero',
    'Commission rate not found for category/model': 'commission_not_found',
    'Logistics fee missing for this model': 'logistics_fee_missing',
    'Auto model cannot be decided - please select FBS or FBO manually': 'auto_model_ambiguous',
  };
  return hintMap[hint] || '';
};

// Watch filters
watch([() => filters.store_id, () => filters.product_status, () => filters.price_status, () => filters.model], () => {
  page.value = 1;
  fetchProfitAnalysis();
}, { deep: true });

// Initialize
onMounted(() => {
  fetchStores();
  fetchProfitAnalysis();
});
</script>

<style scoped>
/* Additional custom styles can go here if needed */
</style>
