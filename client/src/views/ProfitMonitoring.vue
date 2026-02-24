<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ $t('profit_monitoring.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ $t('profit_monitoring.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="exportToExcel" :disabled="exporting" class="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
          <Download :class="['w-4 h-4', exporting ? 'animate-pulse' : '']" />
          {{ $t('marketplace_products.actions.export_excel') }}
        </button>
        <button @click="loadData" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <RefreshCw :class="['w-4 h-4', loading ? 'animate-spin' : '']" />
          {{ $t('profit_monitoring.refresh') }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="s in summary" :key="s.marketplace" class="bg-card border border-border rounded-xl p-4">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold px-2 py-1 rounded-full" :class="marketplaceBadge(s.marketplace)">
            {{ s.marketplace.toUpperCase() }}
          </span>
          <span class="text-muted-foreground text-sm">{{ Number(s.total_skus).toLocaleString() }} SKUs</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p class="text-muted-foreground text-xs">{{ $t('profit_monitoring.avg_price') }}</p>
            <p class="font-semibold text-foreground">{{ formatPrice(s.avg_price) }}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs">{{ $t('profit_monitoring.total_commission') }}</p>
            <p class="font-semibold text-orange-500">{{ formatPrice(s.total_commission) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-card border border-border rounded-xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">{{ $t('marketplace_products.filters.search') }}</label>
          <input
            v-model="filters.search"
            @input="debouncedLoad"
            type="text"
            :placeholder="$t('profit_monitoring.search_placeholder')"
            class="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <!-- Marketplace Filter -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">{{ $t('profit_monitoring.col_marketplace') }}</label>
          <select v-model="filters.marketplace" @change="page = 1; loadData()"
            class="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">{{ $t('profit_monitoring.all_marketplaces') }}</option>
            <option value="yandex">Yandex</option>
            <option value="wb">Wildberries</option>
            <option value="uzum">Uzum</option>
          </select>
        </div>

        <!-- Margin Status Filter -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">{{ $t('marketplace_products.filters.price_status') }}</label>
          <select v-model="filters.marginStatus" @change="page = 1; applyLocalFilters()"
            class="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">{{ $t('common.all') }}</option>
            <option value="profit">{{ $t('marketplace_products.price_status_options.profit') }}</option>
            <option value="low_margin">{{ $t('marketplace_products.price_status_options.low_margin') }}</option>
            <option value="loss">{{ $t('marketplace_products.price_status_options.loss') }}</option>
            <option value="unknown">{{ $t('marketplace_products.price_status_options.unknown') }}</option>
          </select>
        </div>

        <!-- Total count -->
        <div class="flex items-end">
          <span class="text-muted-foreground text-sm">
            {{ filteredItems.length.toLocaleString() }} / {{ total.toLocaleString() }} {{ $t('profit_monitoring.total_items') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Table -->
    <div v-else-if="filteredItems.length > 0" class="bg-card rounded-xl border border-border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted border-b border-border">
          <tr>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_marketplace') }}</th>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_sku') }}</th>
            <th class="text-left p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_product') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_price') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_commission') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_logistics') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_payout') }}</th>
            <th class="text-right p-4 font-semibold text-foreground">{{ $t('profit_monitoring.col_margin') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="item.id"
            class="border-b border-border/50 hover:bg-muted/20 transition-colors"
          >
            <td class="p-4">
              <span class="text-xs font-bold px-2 py-1 rounded-full" :class="marketplaceBadge(item.marketplace)">
                {{ item.marketplace.toUpperCase() }}
              </span>
            </td>
            <td class="p-4 font-mono text-xs text-muted-foreground">{{ item.sku_id }}</td>
            <td class="p-4 text-foreground max-w-[220px] truncate" :title="item.product_name">
              {{ item.product_name || '—' }}
            </td>
            <td class="p-4 text-right font-medium text-foreground">{{ formatPrice(item.sell_price) }}</td>
            <td class="p-4 text-right text-orange-500">{{ formatPrice(item.commission) }}</td>
            <td class="p-4 text-right text-blue-500">{{ formatPrice(item.logistics_fee) }}</td>
            <td class="p-4 text-right text-foreground">{{ formatPrice(item.payout) }}</td>
            <td class="p-4 text-right font-semibold" :class="getMarginClass(item)">
              {{ formatPrice(item.margin) }}
              <span v-if="item.sell_price && item.margin" class="text-xs block">
                {{ getMarginPercent(item) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="p-4 border-t border-border flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          {{ $t('profit_monitoring.showing') }} {{ ((page - 1) * limit) + 1 }}–{{ Math.min(page * limit, total) }} {{ $t('profit_monitoring.of') }} {{ total }}
        </div>
        <div class="flex items-center gap-2">
          <button @click="page--; loadData()" :disabled="page <= 1"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
            ← {{ $t('profit_monitoring.prev') }}
          </button>
          <span class="text-sm text-muted-foreground">{{ page }} / {{ pages }}</span>
          <button @click="page++; loadData()" :disabled="page >= pages"
            class="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed">
            {{ $t('profit_monitoring.next') }} →
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-card rounded-xl border border-border p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('profit_monitoring.no_data') }}</h3>
        <p class="text-muted-foreground text-sm">{{ $t('profit_monitoring.search_placeholder') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RefreshCw, BarChart3, Download } from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import api from '../api';

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

interface Summary {
  marketplace: string;
  total_skus: number;
  avg_price: number;
  total_commission: number;
}

const items = ref<ProfitItem[]>([]);
const summary = ref<Summary[]>([]);
const loading = ref(false);
const exporting = ref(false);
const total = ref(0);
const page = ref(1);
const pages = ref(1);
const limit = 50;
const filters = ref({ search: '', marketplace: '', marginStatus: '' });

// Client-side margin status filter applied on top of server results
const filteredItems = computed(() => {
  if (!filters.value.marginStatus) return items.value;
  return items.value.filter(item => {
    const pct = getMarginPercentNum(item);
    if (filters.value.marginStatus === 'profit') return pct !== null && pct >= 20;
    if (filters.value.marginStatus === 'low_margin') return pct !== null && pct >= 0 && pct < 20;
    if (filters.value.marginStatus === 'loss') return pct !== null && pct < 0;
    if (filters.value.marginStatus === 'unknown') return pct === null;
    return true;
  });
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedLoad = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { page.value = 1; loadData(); }, 400);
};

const applyLocalFilters = () => { /* just triggers computed */ };

const loadData = async () => {
  loading.value = true;
  try {
    const params: Record<string, string | number> = { page: page.value, limit };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.marketplace) params.marketplace = filters.value.marketplace;

    const [listRes, summaryRes] = await Promise.all([
      api.get('/profit-monitoring', { params }),
      api.get('/profit-monitoring/summary'),
    ]);

    items.value = listRes.data.items;
    total.value = listRes.data.total;
    pages.value = listRes.data.pages;
    summary.value = summaryRes.data;
  } catch (e) {
    console.error('ProfitMonitoring load error:', e);
  } finally {
    loading.value = false;
  }
};

// Export as styled Excel file using SheetJS
const exportToExcel = async () => {
  exporting.value = true;
  try {
    const params: Record<string, string | number> = { page: 1, limit: 9999 };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.marketplace) params.marketplace = filters.value.marketplace;

    const res = await api.get('/profit-monitoring', { params });
    const allItems: ProfitItem[] = res.data.items;

    // ── Sheet 1: Data ──────────────────────────────────────────
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

    // Column widths
    ws['!cols'] = [
      { wch: 14 }, { wch: 16 }, { wch: 40 },
      { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 12 },
    ];

    // Bold + colored header row
    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1E3A5F' } }, alignment: { horizontal: 'center' } };
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    });

    // Number formats for price columns (cols 3-8)
    dataRows.forEach((_, rowIdx) => {
      for (let c = 3; c <= 7; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c });
        if (ws[cellRef] && ws[cellRef].v != null) {
          ws[cellRef].z = '#,##0';
        }
      }
      // Margin % column
      const pctRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: 8 });
      if (ws[pctRef] && ws[pctRef].v != null) ws[pctRef].z = '0.0"%"';
    });

    // ── Sheet 2: Summary ───────────────────────────────────────
    const summaryHeaders = ['Marketplace', 'Total SKUs', 'Avg Price (UZS)', 'Total Commission (UZS)'];
    const summaryRows = summary.value.map(s => [
      s.marketplace?.toUpperCase(),
      Number(s.total_skus),
      s.avg_price != null ? Math.round(Number(s.avg_price)) : null,
      s.total_commission != null ? Math.round(Number(s.total_commission)) : null,
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    ws2['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 24 }];
    summaryHeaders.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      if (ws2[cellRef]) ws2[cellRef].s = headerStyle;
    });

    // ── Workbook ───────────────────────────────────────────────
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profit Monitoring');
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `profit-monitoring-${date}.xlsx`);
  } catch (e) {
    console.error('Export error:', e);
  } finally {
    exporting.value = false;
  }
};

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
  if (pct >= 20) return 'text-green-500';
  if (pct >= 0) return 'text-orange-500';
  return 'text-red-500';
};

const marketplaceBadge = (mp: string) => {
  if (mp === 'yandex') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  if (mp === 'wb') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
  if (mp === 'uzum') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-muted text-muted-foreground';
};

onMounted(loadData);
</script>
