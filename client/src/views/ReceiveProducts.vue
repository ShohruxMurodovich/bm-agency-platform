<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('products.receive.title') }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('products.receive.subtitle') }}</p>
          </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
          <Loader2 class="w-6 h-6 animate-spin text-muted-foreground mr-2" />
          <span class="text-muted-foreground">{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="requests.length === 0" class="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <div class="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package class="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-medium text-foreground">{{ t('products.receive.no_pending') }}</h3>
          <p class="text-muted-foreground mt-1">{{ t('products.receive.all_caught_up') }}</p>
      </div>

      <div v-else class="space-y-6">
          <div v-for="request in requests" :key="request.id" 
               class="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              
              <!-- Request Header -->
              <div class="bg-muted/30 px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div class="flex items-center gap-4">
                      <div class="bg-card p-2 rounded-lg border border-border shadow-sm">
                          <Store class="w-5 h-5 text-primary" />
                      </div>
                      <div>
                          <h3 class="font-semibold text-foreground">
                              {{ request.seller?.name || t('products.receive.unknown_seller') }}
                          </h3>
                          <div class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span class="font-mono">{{ request.id.substring(0, 8) }}</span>
                              <span>•</span>
                              <span>{{ new Date(request.created_at).toLocaleDateString() }}</span>
                          </div>
                      </div>
                  </div>
                  <div class="flex items-center gap-3">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-800 dark:text-amber-400">
                          {{ t('status.pending') }}
                      </span>
                  </div>
              </div>

              <div class="p-6 space-y-6">
                  <!-- Notes -->
                  <div v-if="request.notes" class="bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-400 flex gap-3">
                      <Info class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                          <span class="font-medium block mb-1">{{ t('products.receive.seller_notes') }}:</span>
                          {{ request.notes }}
                      </div>
                  </div>

                  <!-- Items Table -->
                  <div class="border border-border rounded-lg overflow-hidden bg-card">
                      <table class="w-full text-sm text-left">
                          <thead class="bg-muted/50 text-xs text-muted-foreground uppercase border-b border-border">
                              <tr>
                                  <th class="px-4 py-3 font-medium">{{ t('table.product') }}</th>
                                  <th class="px-4 py-3 font-medium w-32 text-center">{{ t('table.requested') }}</th>
                                  <th class="px-4 py-3 font-medium w-48">{{ t('table.accept_qty') }}</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-border">
                              <tr v-for="item in request.items" :key="item.id" class="bg-card hover:bg-muted/50 transition-colors">
                                  <td class="px-4 py-3 font-medium text-foreground">
                                      {{ item.parent_product?.product_name }}
                                  </td>
                                  <td class="px-4 py-3 text-center">
                                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                          {{ item.requested_quantity }} {{ t('common.units') }}
                                      </span>
                                  </td>
                                  <td class="px-4 py-3">
                                      <div class="flex items-center gap-3">
                                          <div class="relative w-24">
                                              <input
                                                  v-model.number="acceptanceData[request.id]![item.id]"
                                                  type="number"
                                                  min="0"
                                                  @keydown.enter.prevent="onInputEnter"
                                                  :class="[
                                                      'w-full pl-3 pr-2 py-1.5 border rounded-md text-sm font-medium focus:ring-2 focus:ring-offset-1 transition-all bg-background',
                                                      getDiffStatus(request, item) === 'match' 
                                                          ? 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 text-emerald-900 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/20'
                                                          : getDiffStatus(request, item) === 'under'
                                                              ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200 text-amber-900 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/20'
                                                              : 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-destructive dark:text-red-400 dark:border-red-800 dark:bg-red-950/20'
                                                  ]"
                                              />
                                          </div>
                                          
                                          <!-- Visual Diff Indicator -->
                                          <div class="flex-shrink-0 w-8 flex justify-center">
                                              <CheckCircle2 v-if="getDiffStatus(request, item) === 'match'" class="w-5 h-5 text-emerald-500" />
                                              <div v-else-if="getDiffStatus(request, item) === 'under'" 
                                                   class="flex items-center text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                                   {{ getDiffValue(request, item) }}
                                              </div>
                                              <div v-else 
                                                   class="flex items-center text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded">
                                                   {{ getDiffValue(request, item) }}
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  <!-- Action Area -->
                  <div class="flex flex-col sm:flex-row gap-4 pt-2">
                      <div class="flex-1">
                          <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('products.receive.acceptance_notes') }}</label>
                          <textarea
                              v-model="acceptanceNotes[request.id]"
                              rows="1"
                              :placeholder="t('products.receive.notes_placeholder')"
                              class="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground resize-none transition-all focus:rows-3"
                          ></textarea>
                      </div>
                      <div class="flex items-end gap-3">
                          <Button 
                              variant="outline"
                              @click="acceptAll(request)"
                              class="whitespace-nowrap"
                          >
                              {{ t('common.accept_all') }}
                          </Button>
                          <Button
                              @click="acceptRequest(request)"
                              :disabled="processing[request.id]"
                              class="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap min-w-[120px] shadow-sm"
                          >
                              <Loader2 v-if="processing[request.id]" class="w-4 h-4 mr-2 animate-spin" />
                              {{ processing[request.id] ? t('common.loading') : t('common.confirm_receipt') }}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { toast } from 'vue-sonner';
import { Package, Store, Info, Loader2, CheckCircle2 } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';

const { t } = useI18n();
const requests = ref<any[]>([]);
const loading = ref(true);
const processing = reactive<Record<string, boolean>>({});
const acceptanceData = reactive<Record<string, Record<string, number>>>({});
const acceptanceNotes = reactive<Record<string, string>>({});

const getDiffStatus = (request: any, item: any) => {
    const accepted = acceptanceData[request.id]?.[item.id] ?? 0;
    const requested = item.requested_quantity;
    
    if (accepted === requested) return 'match';
    if (accepted < requested) return 'under';
    return 'over';
};

const getDiffValue = (request: any, item: any) => {
    const accepted = acceptanceData[request.id]?.[item.id] ?? 0;
    const requested = item.requested_quantity;
    const diff = accepted - requested;
    return diff > 0 ? `+${diff}` : `${diff}`;
};

const onInputEnter = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
    const index = inputs.indexOf(target);
    if (index > -1 && index < inputs.length - 1) {
        (inputs[index + 1] as HTMLElement).focus();
    }
};

const initializeAcceptanceData = (request: any) => {
    if (!acceptanceData[request.id]) {
        acceptanceData[request.id] = {};
    }
    request.items.forEach((item: any) => {
        acceptanceData[request.id]![item.id] = item.requested_quantity;
    });
};

const acceptAll = (request: any) => {
    if (!acceptanceData[request.id]) return;
    request.items.forEach((item: any) => {
        acceptanceData[request.id]![item.id] = item.requested_quantity;
    });
    toast.info(`Set all quantities to max for #${request.id.substring(0, 8)}`);
};

const acceptRequest = async (request: any) => {
    processing[request.id] = true;
    try {
        const requestData = acceptanceData[request.id];
        if (!requestData) return;
        
        await api.put(`/product-movement/${request.id}/accept`, {
            items: Object.entries(requestData).map(([itemId, quantity]) => ({
                item_id: itemId,
                accepted_quantity: quantity
            })),
            notes: acceptanceNotes[request.id] || undefined
        });

        toast.success(t('common.success_approved'));
        fetchRequests(); // Reload
    } catch (error: any) {
        console.error('Failed to accept request', error);
        toast.error(error.response?.data?.message || t('common.error_generic'));
    } finally {
        processing[request.id] = false;
    }
};

const fetchRequests = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/product-movement?type=send');
        requests.value = data.filter((r: any) => r.status === 'pending');
        requests.value.forEach(initializeAcceptanceData);
    } catch (error) {
        console.error('Failed to load requests', error);
        toast.error(t('common.error_load_data'));
    } finally {
        loading.value = false;
    }
};

onMounted(fetchRequests);
</script>
