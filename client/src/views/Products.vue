<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('products.title') }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('products.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
              <Button v-if="activeTab === 0" @click="$router.push('/products/new')">
                  <Plus class="w-4 h-4 mr-2" />
                  {{ t('products.add') }}
              </Button>
              <Button v-if="activeTab === 1" variant="outline" @click="exportProfitExcel" :disabled="profitExporting">
                  <Download :class="['w-4 h-4 mr-2', profitExporting ? 'animate-pulse' : '']" />
                  {{ t('marketplace_products.actions.export_excel') }}
              </Button>
          </div>
      </div>

      <!-- Tabs: show Profit Monitoring tab only for Admin/Staff -->
      <div class="flex items-center justify-between">
          <TabContainer
            :tabs="tabLabels"
            v-model="activeTab"
          />
      </div>

      <!-- ═══════════════════════════════════════════
           TAB 0: PARENT PRODUCTS
      ═══════════════════════════════════════════ -->
      <div v-if="activeTab === 0">
          <!-- Seller filter (Admin/Staff only) -->
          <div class="bg-card p-4 rounded-xl border border-border shadow-sm mb-4" v-if="authStore.isAdmin || authStore.isStaff">
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-foreground min-w-[80px]">{{ t('common.seller') }}:</label>
                  <select v-model="selectedSeller" @change="fetchParentProducts" class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                      <option value="">{{ t('common.all_sellers') }}</option>
                      <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                  </select>
              </div>
          </div>

          <!-- Search -->
          <div class="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 mb-4">
              <div class="relative flex-1">
                  <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input :placeholder="t('common.search_products')" class="pl-9" v-model="parentSearchQuery" @keyup.enter="fetchParentProducts" />
              </div>
              <Button class="w-full sm:w-auto" @click="fetchParentProducts">
                  <Search class="w-4 h-4 mr-2" />
                  {{ t('common.search') }}
              </Button>
          </div>

          <!-- Parent Products Table -->
          <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div v-if="parentLoading" class="p-12 flex justify-center text-muted-foreground">
                  <Loader2 class="w-6 h-6 animate-spin mr-2" />
                  {{ t('products.loading') }}
              </div>
              <div v-else-if="parentError" class="p-8 text-center text-destructive">{{ parentError }}</div>
              <div v-else-if="parentProducts.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <Package class="w-8 h-8 text-muted-foreground/50 mb-3" />
                  <h3 class="text-lg font-medium text-foreground">{{ t('common.no_products_found') }}</h3>
                  <p class="text-sm mt-1">{{ t('products.empty_start') }}</p>
              </div>
              <div v-else class="overflow-x-auto">
                   <table class="w-full text-sm text-left">
                       <thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                           <tr>
                               <th class="px-6 py-4 font-medium">{{ t('table.product_name') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.cost') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.stock') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.linked') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.created') }}</th>
                               <th class="px-6 py-4 font-medium text-right">{{ t('table.action') }}</th>
                           </tr>
                       </thead>
                       <tbody class="divide-y divide-border">
                           <tr v-for="product in parentProducts" :key="product.id" class="hover:bg-muted/50 transition-colors group">
                               <td class="px-6 py-4 font-medium text-foreground border-l-4 border-transparent hover:border-primary transition-all">
                                   {{ product.product_name }}
                                </td>
                                <td class="px-6 py-4 text-foreground">
                                   <span v-if="product.cost_usd">${{ product.cost_usd }}</span>
                                   <span v-else-if="product.cost_uzs">{{ formatNumber(product.cost_uzs) }} UZS</span>
                                   <span v-else class="text-muted-foreground">—</span>
                                </td>
                                <td class="px-6 py-4">
                                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                         :class="product.stock > 0 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'">
                                       {{ product.stock || 0 }}
                                   </span>
                                </td>
                                <td class="px-6 py-4 text-muted-foreground">
                                   <span class="text-primary font-medium">{{ product.linked_count || 0 }}</span>
                                </td>
                                <td class="px-6 py-4 text-muted-foreground text-xs">
                                   {{ new Date(product.created_at).toLocaleDateString() }}
                                </td>
                                <td class="px-6 py-4 text-right space-x-2">
                                   <template v-if="authStore.user?.role !== 'public_user'">
                                     <Button variant="ghost" size="icon" @click="$router.push(`/products/${product.id}`)">
                                         <Pencil class="w-4 h-4 text-muted-foreground" />
                                     </Button>
                                     <Button variant="ghost" size="icon" @click="confirmDelete(product.id)" class="text-destructive hover:text-destructive hover:bg-destructive/10">
                                         <Trash2 class="w-4 h-4" />
                                     </Button>
                                   </template>
                                </td>
                           </tr>
                       </tbody>
                   </table>
              </div>
          </div>
      </div>

      <!-- ═══════════════════════════════════════════
           TAB 1: PROFIT MONITORING (Admin/Staff only)
      ═══════════════════════════════════════════ -->
      <div v-if="activeTab === 1">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div v-for="s in profitSummary" :key="s.marketplace"
                   class="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div class="flex items-center justify-between mb-4">
                      <span class="text-xs font-bold px-2.5 py-1 rounded-full" :class="marketplaceBadge(s.marketplace)">
                          {{ s.marketplace.toUpperCase() }}
                      </span>
                      <span class="text-muted-foreground text-xs font-medium">{{ Number(s.total_skus).toLocaleString() }} SKUs</span>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                      <div>
                          <p class="text-muted-foreground text-[11px] uppercase tracking-wider mb-0.5">{{ t('profit_monitoring.avg_price') }}</p>
                          <p class="font-semibold text-foreground text-sm">{{ formatPrice(s.avg_price) }}</p>
                      </div>
                      <div>
                          <p class="text-muted-foreground text-[11px] uppercase tracking-wider mb-0.5">{{ t('profit_monitoring.total_commission') }}</p>
                          <p class="font-semibold text-orange-500 text-sm">{{ formatPrice(s.total_commission) }}</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Filters -->
          <div class="bg-card p-4 rounded-xl border border-border shadow-sm mb-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <!-- Search -->
                  <div>
                      <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{{ t('marketplace_products.filters.search') }}</label>
                      <div class="relative">
                          <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <input v-model="profitFilters.search" @input="debouncedProfitLoad" type="text"
                              :placeholder="t('profit_monitoring.search_placeholder')"
                              class="w-full bg-background border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                  </div>

                  <!-- Marketplace -->
                  <div>
                      <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{{ t('profit_monitoring.col_marketplace') }}</label>
                      <select v-model="profitFilters.marketplace" @change="profitPage = 1; loadProfitData()"
                          class="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">{{ t('profit_monitoring.all_marketplaces') }}</option>
                          <option value="yandex">Yandex Market</option>
                          <option value="wb">Wildberries</option>
                          <option value="uzum">Uzum</option>
                      </select>
                  </div>

                  <!-- Margin Status -->
                  <div>
                      <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{{ t('marketplace_products.filters.price_status') }}</label>
                      <select v-model="profitFilters.marginStatus" @change="profitPage = 1; applyMarginFilter()"
                          class="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">{{ t('common.all') }}</option>
                          <option value="profit">{{ t('marketplace_products.price_status_options.profit') }}</option>
                          <option value="low_margin">{{ t('marketplace_products.price_status_options.low_margin') }}</option>
                          <option value="loss">{{ t('marketplace_products.price_status_options.loss') }}</option>
                          <option value="unknown">{{ t('marketplace_products.price_status_options.unknown') }}</option>
                      </select>
                  </div>

                  <!-- Count -->
                  <div class="flex items-end pb-1">
                      <div class="flex items-center gap-2 text-muted-foreground text-sm">
                          <BarChart3 class="w-4 h-4" />
                          <span>{{ profitFilteredItems.length.toLocaleString() }} / {{ profitTotal.toLocaleString() }} {{ t('profit_monitoring.total_items') }}</span>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Loading -->
          <div v-if="profitLoading" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3">
                  <div class="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
                  <span class="text-sm text-muted-foreground">{{ t('products.loading') }}</span>
              </div>
          </div>

          <!-- Table -->
          <div v-else-if="profitFilteredItems.length > 0" class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                      <thead class="bg-muted/50 border-b border-border">
                          <tr>
                              <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_marketplace') }}</th>
                              <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider w-[90px]">{{ t('profit_monitoring.col_sku') }}</th>
                              <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_product') }}</th>
                              <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_price') }}</th>
                              <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_commission') }}</th>
                              <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_logistics') }}</th>
                              <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_payout') }}</th>
                              <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">{{ t('profit_monitoring.col_margin') }}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(item, idx) in profitFilteredItems" :key="item.id"
                              :class="['border-b border-border/40 hover:bg-muted/30 transition-colors', idx % 2 === 0 ? '' : 'bg-muted/10']">
                              <td class="px-4 py-3">
                                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="marketplaceBadge(item.marketplace)">
                                      {{ item.marketplace.toUpperCase() }}
                                  </span>
                              </td>
                              <td class="px-4 py-3 font-mono text-[11px] text-muted-foreground w-[90px] truncate" :title="item.sku_id">{{ item.sku_id }}</td>
                              <td class="px-4 py-3 text-foreground text-sm" :title="item.product_name">
                                  {{ item.product_name || '—' }}
                              </td>
                              <td class="px-4 py-3 text-right font-medium text-foreground tabular-nums">{{ formatPrice(item.sell_price) }}</td>
                              <td class="px-4 py-3 text-right text-orange-500 tabular-nums">{{ formatPrice(item.commission) }}</td>
                              <td class="px-4 py-3 text-right text-blue-500 tabular-nums">{{ formatPrice(item.logistics_fee) }}</td>
                              <td class="px-4 py-3 text-right text-foreground tabular-nums">{{ formatPrice(item.payout) }}</td>
                              <td class="px-4 py-3 text-right tabular-nums">
                                  <div class="flex flex-col items-end">
                                      <span class="font-semibold" :class="getMarginClass(item)">{{ formatPrice(item.margin) }}</span>
                                      <span v-if="item.sell_price && item.margin"
                                            class="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium"
                                            :class="getMarginBadge(item)">
                                          {{ getMarginPercent(item) }}%
                                      </span>
                                  </div>
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>

              <!-- Pagination -->
              <div class="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                  <div class="text-xs text-muted-foreground">
                      {{ t('profit_monitoring.showing') }} <span class="font-medium text-foreground">{{ ((profitPage - 1) * profitLimit) + 1 }}–{{ Math.min(profitPage * profitLimit, profitTotal) }}</span> {{ t('profit_monitoring.of') }} {{ profitTotal }}
                  </div>
                  <div class="flex items-center gap-1">
                      <button @click="profitPage--; loadProfitData()" :disabled="profitPage <= 1"
                          class="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          ← {{ t('profit_monitoring.prev') }}
                      </button>
                      <span class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg">{{ profitPage }} / {{ profitPages }}</span>
                      <button @click="profitPage++; loadProfitData()" :disabled="profitPage >= profitPages"
                          class="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          {{ t('profit_monitoring.next') }} →
                      </button>
                  </div>
              </div>
          </div>

          <!-- Empty -->
          <div v-else class="bg-card rounded-xl border border-border p-16 text-center">
              <div class="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 class="w-7 h-7 text-primary" />
              </div>
              <h3 class="text-lg font-semibold text-foreground mb-2">{{ t('profit_monitoring.no_data') }}</h3>
              <p class="text-sm text-muted-foreground max-w-sm mx-auto">{{ t('profit_monitoring.search_placeholder') }}</p>
          </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <Dialog
        :isOpen="isDeleteDialogOpen"
        :title="t('products.delete.title')"
        :description="t('products.delete.description')"
        @close="isDeleteDialogOpen = false"
        @confirm="deleteProduct"
      >
        <div class="p-4 bg-red-500/10 rounded-md text-red-700 dark:text-red-400 text-sm">
            {{ t('products.delete.warning') }}
        </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import * as XLSX from 'xlsx';
import api from '../api';

const { t } = useI18n();
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Dialog from '../components/ui/Dialog.vue';
import TabContainer from '../components/ui/TabContainer.vue';
import { Plus, Search, Loader2, Trash2, Pencil, Package, BarChart3, Download } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

// ── Tabs: Profit Monitoring visible only for Admin/Staff ──────
const tabLabels = computed(() => {
    return [t('products.tabs.parent_products'), t('profit_monitoring.title')];
});
const activeTab = ref(0);

// ── Parent Products ───────────────────────────────────────────
const parentProducts = ref<any[]>([]);
const parentLoading = ref(true);
const parentError = ref('');
const parentSearchQuery = ref('');
const selectedSeller = ref('');
const sellers = ref<any[]>([]);

const fetchSellers = async () => {
    if (!authStore.isAdmin && !authStore.isStaff) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) { console.error(e); }
};

const fetchParentProducts = async () => {
    try {
        parentLoading.value = true;
        const params: any = { search: parentSearchQuery.value };
        if (selectedSeller.value) params.seller_id = selectedSeller.value;
        const response = await api.get('/parent-products', { params });
        parentProducts.value = response.data;
        parentError.value = '';
    } catch (e) {
        parentError.value = 'Failed to load products';
    } finally {
        parentLoading.value = false;
    }
};

// ── Profit Monitoring (uses /profit-monitoring API) ───────────
interface ProfitItem {
    id: string;
    marketplace: string;
    sku_id: string;
    product_name: string;
    sell_price: number;
    commission: number;
    logistics_fee: number;
    payout: number;
    margin: number;
}

interface ProfitSummary {
    marketplace: string;
    total_skus: number;
    avg_price: number;
    total_commission: number;
}

const profitItems = ref<ProfitItem[]>([]);
const profitSummary = ref<ProfitSummary[]>([]);
const profitLoading = ref(false);
const profitExporting = ref(false);
const profitTotal = ref(0);
const profitPage = ref(1);
const profitPages = ref(1);
const profitLimit = 50;
const profitFilters = ref({ search: '', marketplace: '', marginStatus: '' });

const profitFilteredItems = computed(() => {
    if (!profitFilters.value.marginStatus) return profitItems.value;
    return profitItems.value.filter(item => {
        const pct = getMarginPercentNum(item);
        if (profitFilters.value.marginStatus === 'profit') return pct !== null && pct >= 20;
        if (profitFilters.value.marginStatus === 'low_margin') return pct !== null && pct >= 0 && pct < 20;
        if (profitFilters.value.marginStatus === 'loss') return pct !== null && pct < 0;
        if (profitFilters.value.marginStatus === 'unknown') return pct === null;
        return true;
    });
});

let profitDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedProfitLoad = () => {
    if (profitDebounceTimer) clearTimeout(profitDebounceTimer);
    profitDebounceTimer = setTimeout(() => { profitPage.value = 1; loadProfitData(); }, 400);
};

const applyMarginFilter = () => { /* triggers computed */ };

const loadProfitData = async () => {
    profitLoading.value = true;
    try {
        const params: Record<string, string | number> = { page: profitPage.value, limit: profitLimit };
        if (profitFilters.value.search) params.search = profitFilters.value.search;
        if (profitFilters.value.marketplace) params.marketplace = profitFilters.value.marketplace;

        const [listRes, summaryRes] = await Promise.all([
            api.get('/profit-monitoring', { params }),
            api.get('/profit-monitoring/summary'),
        ]);

        profitItems.value = listRes.data.items;
        profitTotal.value = listRes.data.total;
        profitPages.value = listRes.data.pages;
        profitSummary.value = summaryRes.data;
    } catch (e) {
        console.error('ProfitMonitoring load error:', e);
    } finally {
        profitLoading.value = false;
    }
};

// Excel export
const exportProfitExcel = async () => {
    profitExporting.value = true;
    try {
        const params: Record<string, string | number> = { page: 1, limit: 9999 };
        if (profitFilters.value.search) params.search = profitFilters.value.search;
        if (profitFilters.value.marketplace) params.marketplace = profitFilters.value.marketplace;

        const res = await api.get('/profit-monitoring', { params });
        const allItems: ProfitItem[] = res.data.items;

        const headers = [
            'Marketplace', 'SKU ID', 'Product Name',
            'Sell Price (UZS)', 'Commission (UZS)', 'Logistics (UZS)',
            'Payout (UZS)', 'Margin (UZS)', 'Margin %',
        ];

        const dataRows = allItems.map(item => [
            item.marketplace?.toUpperCase() ?? '',
            item.sku_id ?? '',
            item.product_name ?? '',
            item.sell_price != null ? Number(item.sell_price) : null,
            item.commission != null ? Number(item.commission) : null,
            item.logistics_fee != null ? Number(item.logistics_fee) : null,
            item.payout != null ? Number(item.payout) : null,
            item.margin != null ? Number(item.margin) : null,
            getMarginPercentNum(item),
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        ws['!cols'] = [
            { wch: 14 }, { wch: 16 }, { wch: 40 },
            { wch: 18 }, { wch: 18 }, { wch: 18 },
            { wch: 18 }, { wch: 18 }, { wch: 12 },
        ];

        const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center' } };
        headers.forEach((_, c) => { const ref = XLSX.utils.encode_cell({ r: 0, c }); if (ws[ref]) ws[ref].s = headerStyle; });

        const summaryHeaders = ['Marketplace', 'Total SKUs', 'Avg Price (UZS)', 'Total Commission (UZS)'];
        const summaryRows = profitSummary.value.map(s => [
            s.marketplace?.toUpperCase(),
            Number(s.total_skus),
            s.avg_price != null ? Math.round(Number(s.avg_price)) : null,
            s.total_commission != null ? Math.round(Number(s.total_commission)) : null,
        ]);
        const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
        ws2['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 24 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Profit Monitoring');
        XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
        XLSX.writeFile(wb, `profit-monitoring-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
        toast.error('Export failed');
        console.error(e);
    } finally {
        profitExporting.value = false;
    }
};

// ── Helpers ───────────────────────────────────────────────────
const formatNumber = (num: string | number) => new Intl.NumberFormat().format(Number(num));

const formatPrice = (val: number | null) => {
    if (val == null) return '—';
    return Number(val).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' UZS';
};

const getMarginPercentNum = (item: ProfitItem): number | null => {
    if (!item.sell_price || !item.margin) return null;
    return Math.round((Number(item.margin) / Number(item.sell_price)) * 100 * 10) / 10;
};

const getMarginPercent = (item: ProfitItem) => getMarginPercentNum(item) ?? '—';

const getMarginClass = (item: ProfitItem) => {
    const pct = getMarginPercentNum(item);
    if (pct === null) return 'text-muted-foreground';
    if (pct >= 20) return 'text-green-600 dark:text-green-400';
    if (pct >= 0) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

const getMarginBadge = (item: ProfitItem) => {
    const pct = getMarginPercentNum(item);
    if (pct === null) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    if (pct >= 20) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    if (pct >= 0) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
};

const marketplaceBadge = (mp: string) => {
    if (mp === 'yandex') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    if (mp === 'wb') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    if (mp === 'uzum') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    return 'bg-muted text-muted-foreground';
};

// ── Delete ────────────────────────────────────────────────────
const isDeleteDialogOpen = ref(false);
const productToDelete = ref<number | null>(null);

const confirmDelete = (id: number) => { productToDelete.value = id; isDeleteDialogOpen.value = true; };
const deleteProduct = async () => {
    if (!productToDelete.value) return;
    try {
        await api.delete(`/parent-products/${productToDelete.value}`);
        fetchParentProducts();
        toast.success('Product deleted');
        isDeleteDialogOpen.value = false;
        productToDelete.value = null;
    } catch (e) { toast.error('Failed to delete product'); }
};

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
    await fetchSellers();
    await fetchParentProducts();
    loadProfitData();
});
</script>
