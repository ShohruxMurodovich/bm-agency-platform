<template>
  <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ isEdit ? t('products.edit_title') : t('products.new_title') }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('products.form_subtitle', { action: isEdit ? t('products.update_action') : t('products.create_action') }) }}</p>
          </div>
          <div class="flex gap-3">
              <Button variant="outline" @click="$router.back()">{{ t('common.cancel') }}</Button>
              <Button @click="saveProduct" :disabled="!canSave">{{ t('common.save') }}</Button>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Main Info -->
          <div class="lg:col-span-2 space-y-6">
              <!-- Seller Selection (Admin/Staff see dropdown, Seller/Public auto-resolved) -->
              <div class="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-4"
                   v-if="authStore.isAdmin || authStore.isStaff">
                  <h3 class="text-lg font-semibold border-b border-border pb-2">{{ t('products.sections.seller') }}</h3>
                  <div class="space-y-2">
                      <label class="text-sm font-medium text-foreground">{{ t('products.fields.select_seller') }} *</label>
                      <select v-model="form.seller_id"
                              :disabled="isEdit"
                              class="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              @change="onSellerChange">
                          <option value="">{{ t('products.fields.select_seller_placeholder') }}</option>
                          <option v-for="seller in sellers" :key="seller.id" :value="seller.id">
                              {{ seller.name }}
                          </option>
                      </select>
                      <p v-if="isEdit" class="text-xs text-muted-foreground">{{ t('products.fields.seller_immutable') }}</p>
                  </div>
              </div>

              <!-- Basic Details Card -->
              <div class="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-4">
                  <h3 class="text-lg font-semibold border-b border-border pb-2">{{ t('products.sections.basic') }}</h3>

                  <div class="space-y-2">
                       <label class="text-sm font-medium text-foreground">{{ t('products.fields.product_name') }} *</label>
                       <Input v-model="form.product_name" :placeholder="t('products.fields.product_name_placeholder')" />
                  </div>

                  <div class="space-y-2">
                      <label class="text-sm font-medium text-foreground">{{ t('products.fields.description') }}</label>
                      <textarea
                        v-model="form.description"
                        class="flex w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[120px]"
                        :placeholder="t('products.fields.description_placeholder')"
                      ></textarea>
                  </div>
              </div>

               <!-- Cost & Stock Card -->
              <div class="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-4">
                  <h3 class="text-lg font-semibold border-b border-border pb-2">{{ t('products.sections.cost_stock') }}</h3>

                  <div class="grid grid-cols-3 gap-4">
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-foreground">{{ t('products.fields.cost_usd') }}</label>
                           <Input v-model.number="form.cost_usd" type="number" step="0.01" placeholder="0.00" />
                      </div>
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-foreground">{{ t('products.fields.cost_uzs') }}</label>
                           <Input v-model.number="form.cost_uzs" type="number" placeholder="0" />
                      </div>
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-foreground">{{ t('products.fields.stock') }} *</label>
                           <Input v-model.number="form.stock" type="number" placeholder="0" min="0" />
                      </div>
                  </div>
                  <p class="text-xs text-muted-foreground mt-2">
                      {{ t('products.fields.stock_hint') }}
                  </p>
              </div>

              <!-- ═══════════════════════════════════════
                   MARKETPLACE MAPPING SECTION
              ═══════════════════════════════════════ -->
              <div class="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-4">
                  <div class="flex items-center justify-between border-b border-border pb-2">
                      <h3 class="text-lg font-semibold">Marketplace Mapping</h3>
                      <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {{ mappings.length }} linked
                      </span>
                  </div>

                  <p class="text-sm text-muted-foreground">
                      Link marketplace products (SKUs) to this parent product for profit tracking and stock sync.
                  </p>

                  <!-- Existing mappings list -->
                  <div v-if="mappings.length > 0" class="space-y-2">
                      <div v-for="m in mappings" :key="m.id"
                           class="flex items-center justify-between bg-muted/30 border border-border/50 rounded-lg px-4 py-3">
                          <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-foreground truncate">
                                  {{ m.marketplace_product?.title || m.marketplace_product?.sku_name || 'Unknown' }}
                              </p>
                              <p class="text-xs text-muted-foreground mt-0.5">
                                  SKU: {{ m.marketplace_product?.external_product_id || m.marketplace_product_id }}
                                  <span v-if="m.marketplace_product?.store?.name" class="ml-2">• {{ m.marketplace_product.store.name }}</span>
                              </p>
                          </div>
                          <button @click="removeMapping(m.id)" class="ml-3 p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                              <Trash2 class="w-4 h-4" />
                          </button>
                      </div>
                  </div>

                  <!-- Add new mapping -->
                  <div class="border border-dashed border-border rounded-lg p-4 space-y-3 bg-muted/10">
                      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Mapping</p>

                      <!-- Store selection -->
                      <div>
                          <label class="block text-sm font-medium text-foreground mb-1">Store</label>
                          <select v-model="newMapping.store_id" @change="onMappingStoreChange"
                              class="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                              <option value="">Select a store...</option>
                              <option v-for="store in mappingStores" :key="store.id" :value="store.id">
                                  {{ store.name || store.store_name || `Store ${store.external_shop_id}` }}
                              </option>
                          </select>
                      </div>

                      <!-- Marketplace product search -->
                      <div v-if="newMapping.store_id">
                          <label class="block text-sm font-medium text-foreground mb-1">Marketplace Product</label>
                          <div class="relative">
                              <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <input v-model="newMapping.search" @input="debouncedSearchMpProducts" type="text"
                                  placeholder="Search by title, SKU name, or SKU ID..."
                                  class="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>

                          <!-- Search results dropdown -->
                          <div v-if="mpSearchResults.length > 0" class="mt-1 border border-border rounded-lg bg-card shadow-lg max-h-48 overflow-y-auto">
                              <button v-for="mp in mpSearchResults" :key="mp.id"
                                  @click="addMapping(mp)"
                                  :disabled="isMapped(mp.id)"
                                  class="w-full text-left px-4 py-2.5 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                  <p class="text-sm font-medium text-foreground truncate">{{ mp.title || mp.sku_name }}</p>
                                  <p class="text-xs text-muted-foreground">
                                      SKU: {{ mp.external_product_id || mp.sku_id }}
                                      <span v-if="isMapped(mp.id)" class="text-primary ml-1">(already linked)</span>
                                  </p>
                              </button>
                          </div>

                          <p v-if="newMapping.search && mpSearchResults.length === 0 && !mpSearching" class="text-xs text-muted-foreground mt-1">
                              No marketplace products found for this search.
                          </p>
                          <p v-if="mpSearching" class="text-xs text-muted-foreground mt-1">
                              <Loader2 class="w-3 h-3 animate-spin inline mr-1" /> Searching...
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Right Column: Info -->
          <div class="space-y-6">
              <div class="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 space-y-4">
                   <h3 class="text-lg font-semibold border-b border-border pb-2">{{ t('products.sections.info') }}</h3>

                   <div class="text-sm text-muted-foreground space-y-3">
                       <div class="flex items-start">
                           <div class="mt-0.5 mr-3 p-1.5 bg-amber-500/10 rounded-lg">
                               <Package class="w-5 h-5 text-amber-600 dark:text-amber-500" />
                           </div>
                           <div>
                               <div class="font-medium text-foreground">{{ t('products.fields.info_parent_title') }}</div>
                               <p class="text-xs mt-1">{{ t('products.fields.info_parent_desc') }}</p>
                           </div>
                       </div>
                       <div class="flex items-start mt-4">
                           <div class="mt-0.5 mr-3 p-1.5 bg-blue-500/10 rounded-lg">
                               <BarChart3 class="w-5 h-5 text-blue-600 dark:text-blue-500" />
                           </div>
                           <div>
                               <div class="font-medium text-foreground">{{ t('products.fields.info_stock_title') }}</div>
                               <p class="text-xs mt-1">{{ t('products.fields.info_stock_desc') }}</p>
                           </div>
                       </div>
                       <div class="flex items-start mt-4">
                           <div class="mt-0.5 mr-3 p-1.5 bg-green-500/10 rounded-lg">
                               <Link class="w-5 h-5 text-green-600 dark:text-green-500" />
                           </div>
                           <div>
                               <div class="font-medium text-foreground">Marketplace Mapping</div>
                               <p class="text-xs mt-1">Link marketplace SKUs to this product for automated profit tracking and stock synchronization.</p>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      <!-- Inventory Section (Read-Only) -->
      <div v-if="isEdit" class="space-y-4">
           <h2 class="text-xl font-bold text-foreground border-b border-border pb-2">Inventory Management</h2>
           <ProductInventory :productId="route.params.id as string" />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import ProductInventory from '../components/inventory/ProductInventory.vue';
import { toast } from 'vue-sonner';
import { Package, BarChart3, Search, Trash2, Loader2, Link } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isEdit = computed(() => route.params.id !== 'new');

const sellers = ref<any[]>([]);
const form = ref({
    seller_id: '',
    product_name: '',
    description: '',
    cost_usd: undefined as number | undefined,
    cost_uzs: undefined as number | undefined,
    stock: 0,
});

const canSave = computed(() => {
    return form.value.seller_id && form.value.product_name && form.value.stock >= 0;
});

// ── Sellers ───────────────────────────────────────────────────
const fetchSellers = async () => {
    if (!authStore.isAdmin && !authStore.isStaff) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        console.error('Failed to fetch sellers');
        toast.error('Failed to load sellers');
    }
};

const onSellerChange = () => {
    // Reload stores when seller changes (for mapping section)
    loadMappingStores();
};

// ── Auto-resolve seller for Seller/Public roles ──────────────
const resolveSellerForNonAdmin = async () => {
    if (authStore.isAdmin || authStore.isStaff) return;
    try {
        const { data } = await api.get('/sellers');
        if (data.length > 0) {
            form.value.seller_id = data[0].id;
        }
    } catch (e) { console.error(e); }
};

// ── Marketplace Mapping ──────────────────────────────────────
const mappings = ref<any[]>([]);
const mappingStores = ref<any[]>([]);
const mpSearchResults = ref<any[]>([]);
const mpSearching = ref(false);
const newMapping = ref({ store_id: '', search: '' });

const loadMappings = async () => {
    if (!isEdit.value || !route.params.id) return;
    try {
        const { data } = await api.get(`/product-mapping?parent_product_id=${route.params.id}`);
        mappings.value = data;
    } catch (e) {
        // If the endpoint returns all and doesn't support query param, filter client-side
        try {
            const { data } = await api.get('/product-mapping');
            mappings.value = data.filter((m: any) => m.parent_product_id === route.params.id);
        } catch (e2) { console.error(e2); }
    }
};

const loadMappingStores = async () => {
    try {
        const params: any = {};
        // Admin/Staff: if seller is selected, scope stores to that seller
        if ((authStore.isAdmin || authStore.isStaff) && form.value.seller_id) {
            params.seller_id = form.value.seller_id;
        }
        const { data } = await api.get('/stores', { params });
        mappingStores.value = data;
    } catch (e) { console.error(e); }
};

const onMappingStoreChange = () => {
    newMapping.value.search = '';
    mpSearchResults.value = [];
};

let mpDebounce: ReturnType<typeof setTimeout> | null = null;
const debouncedSearchMpProducts = () => {
    if (mpDebounce) clearTimeout(mpDebounce);
    mpDebounce = setTimeout(() => searchMpProducts(), 400);
};

const searchMpProducts = async () => {
    if (!newMapping.value.store_id || !newMapping.value.search) {
        mpSearchResults.value = [];
        return;
    }
    mpSearching.value = true;
    try {
        const { data } = await api.get('/marketplace-products', {
            params: {
                store_id: newMapping.value.store_id,
                search: newMapping.value.search,
            },
        });
        mpSearchResults.value = Array.isArray(data) ? data : (data.items || []);
    } catch (e) {
        console.error(e);
        mpSearchResults.value = [];
    } finally {
        mpSearching.value = false;
    }
};

const isMapped = (mpId: string) => mappings.value.some(m => m.marketplace_product_id === mpId);

const addMapping = async (mp: any) => {
    if (isMapped(mp.id)) return;
    if (!isEdit.value) {
        toast.error('Please save the product first before adding mappings');
        return;
    }
    try {
        await api.post('/product-mapping', {
            parent_product_id: route.params.id,
            marketplace_product_id: mp.id,
            match_status: 'manual',
            matched_by: authStore.user?.id,
        });
        toast.success('Mapping added');
        mpSearchResults.value = [];
        newMapping.value.search = '';
        await loadMappings();
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to add mapping');
    }
};

const removeMapping = async (mappingId: string) => {
    try {
        await api.delete(`/product-mapping/${mappingId}`);
        toast.success('Mapping removed');
        await loadMappings();
    } catch (e) {
        toast.error('Failed to remove mapping');
    }
};

// ── Save ──────────────────────────────────────────────────────
const saveProduct = async () => {
    if (!canSave.value) {
        toast.error('Please fill in all required fields');
        return;
    }

    try {
        if (isEdit.value) {
            await api.put(`/parent-products/${route.params.id}`, form.value);
            toast.success('Product updated successfully');
        } else {
            await api.post('/parent-products', form.value);
            toast.success('Product created successfully');
        }
        router.push('/products');
    } catch (e: any) {
        console.error('Failed to save product', e);
        toast.error(e.response?.data?.message || 'Failed to save product');
    }
};

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
    await fetchSellers();
    await resolveSellerForNonAdmin();

    if (isEdit.value && route.params.id) {
        try {
            const { data } = await api.get(`/parent-products/${route.params.id}`);
            form.value = {
                seller_id: data.seller_id,
                product_name: data.product_name,
                description: data.description || '',
                cost_usd: data.cost_usd,
                cost_uzs: data.cost_uzs,
                stock: data.stock || 0,
            };
        } catch (e) {
            console.error('Failed to fetch product');
            toast.error('Failed to load product');
        }
        await loadMappings();
    }

    await loadMappingStores();
});
</script>
