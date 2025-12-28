<template>
  <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('products.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('products.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto" v-if="!authStore.isSeller">
              <Button @click="$router.push('/products/new')">
                  <Plus class="w-4 h-4 mr-2" />
                  {{ t('products.add') }}
              </Button>
          </div>
      </div>

      <!-- Two-Tab Structure -->
      <div class="flex items-center justify-between">
          <TabContainer 
            :tabs="[t('products.tabs.parent_products'), t('products.tabs.marketplace_products')]" 
            v-model="activeTab"
          />
      </div>

      <!-- Parent Products Tab -->
      <div v-if="activeTab === 0">
          <!-- Header Filter: Seller -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4" v-if="authStore.isAdmin">
              <div class="flex items-center gap-2">
                  <label class="text-sm font-medium text-slate-700 min-w-[80px]">{{ t('common.seller') }}:</label>
                  <select v-model="selectedSeller" @change="fetchParentProducts" class="flex-1 h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.all_sellers') }}</option>
                      <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                  </select>
              </div>
          </div>

          <!-- Filter Row: Search -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 mb-4">
              <div class="relative flex-1">
                  <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input :placeholder="t('common.search_products')" class="pl-9" v-model="parentSearchQuery" @keyup.enter="fetchParentProducts" />
              </div>
              <Button class="w-full sm:w-auto" @click="fetchParentProducts">
                  <Search class="w-4 h-4 mr-2" />
                  {{ t('common.search') }}
              </Button>
          </div>

          <!-- Parent Products Table -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div v-if="parentLoading" class="p-12 flex justify-center text-slate-500">
                  <Loader2 class="w-6 h-6 animate-spin mr-2" />
                  {{ t('products.loading') }}
              </div>
              <div v-else-if="parentError" class="p-8 text-center text-red-500">{{ parentError }}</div>
              <div v-else-if="parentProducts.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                  <Package class="w-8 h-8 text-slate-300 mb-3" />
                  <h3 class="text-lg font-medium text-slate-900">{{ t('common.no_products_found') }}</h3>
                  <p class="text-sm mt-1">{{ t('products.empty_start') }}</p>
              </div>
              <div v-else class="overflow-x-auto">
                   <table class="w-full text-sm text-left">
                       <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                           <tr>
                               <th class="px-6 py-4 font-medium">{{ t('table.product_name') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.cost') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.stock') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.linked') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.created') }}</th>
                               <th class="px-6 py-4 font-medium text-right">{{ t('table.action') }}</th>
                           </tr>
                       </thead>
                       <tbody class="divide-y divide-slate-100">
                           <tr v-for="product in parentProducts" :key="product.id" class="hover:bg-slate-50/50 transition-colors group">
                               <td class="px-6 py-4 font-medium text-slate-900 border-l-4 border-transparent hover:border-indigo-500 transition-all">
                                   {{ product.product_name }}
                               </td>
                               <td class="px-6 py-4 text-slate-900">
                                   <span v-if="product.cost_usd">${{ product.cost_usd }}</span>
                                   <span v-else-if="product.cost_uzs">{{ formatNumber(product.cost_uzs) }} UZS</span>
                                   <span v-else class="text-slate-400">—</span>
                               </td>
                               <td class="px-6 py-4">
                                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                         :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                       {{ product.stock || 0 }}
                                   </span>
                               </td>
                               <td class="px-6 py-4 text-slate-600">
                                   <span class="text-indigo-600 font-medium">{{ product.linked_count || 0 }}</span>
                               </td>
                               <td class="px-6 py-4 text-slate-500 text-xs">
                                   {{ new Date(product.created_at).toLocaleDateString() }}
                               </td>
                               <td class="px-6 py-4 text-right space-x-2">
                                   <template v-if="!authStore.isSeller">
                                     <Button variant="ghost" size="icon" @click="$router.push(`/products/${product.id}`)">
                                         <Pencil class="w-4 h-4 text-slate-500" />
                                     </Button>
                                     <Button variant="ghost" size="icon" @click="confirmDelete(product.id)" class="text-red-600 hover:text-red-700 hover:bg-red-50">
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

      <!-- Marketplace Products Tab -->
      <div v-if="activeTab === 1">
          <!-- Filter Row: Search only -->
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 mb-4">
              <div class="relative flex-1">
                  <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input :placeholder="t('common.search_marketplace_products')" class="pl-9" v-model="marketplaceSearchQuery" @keyup.enter="fetchMarketplaceProducts" />
              </div>
              <Button class="w-full sm:w-auto" @click="fetchMarketplaceProducts">
                  <Search class="w-4 h-4 mr-2" />
                  {{ t('common.search') }}
              </Button>
          </div>

          <!-- Marketplace Products Table (Read-only) -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div v-if="marketplaceLoading" class="p-12 flex justify-center text-slate-500">
                  <Loader2 class="w-6 h-6 animate-spin mr-2" />
                  {{ t('products.loading') }}
              </div>
              <div v-else-if="marketplaceError" class="p-8 text-center text-red-500">{{ marketplaceError }}</div>
              <div v-else-if="marketplaceProducts.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                  <ShoppingCart class="w-8 h-8 text-slate-300 mb-3" />
                  <h3 class="text-lg font-medium text-slate-900">{{ t('common.no_marketplace_products_found') }}</h3>
              </div>
              <div v-else class="overflow-x-auto">
                   <table class="w-full text-sm text-left">
                       <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                           <tr>
                               <th class="px-6 py-4 font-medium">{{ t('table.image') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.title') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.sku_id') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.sku_name') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.price') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.stock') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.status') }}</th>
                               <th class="px-6 py-4 font-medium">{{ t('table.has_parent') }}</th>
                           </tr>
                       </thead>
                       <tbody class="divide-y divide-slate-100">
                           <tr v-for="product in marketplaceProducts" :key="product.id" class="hover:bg-slate-50/50 transition-colors">
                               <td class="px-6 py-4">
                                   <img v-if="product.image_url" :src="product.image_url" :alt="product.title" class="w-10 h-10 object-cover rounded" />
                                   <div v-else class="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                                       <Package class="w-5 h-5 text-slate-400" />
                                   </div>
                               </td>
                               <td class="px-6 py-4 font-medium text-slate-900">{{ product.title }}</td>
                               <td class="px-6 py-4 text-slate-600">{{ product.sku_id || '—' }}</td>
                               <td class="px-6 py-4 text-slate-600">{{ product.sku_name || '—' }}</td>
                               <td class="px-6 py-4 text-slate-900">
                                   {{ product.price ? formatNumber(product.price) : '—' }}
                               </td>
                               <td class="px-6 py-4">
                                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                         :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                       {{ product.stock || 0 }}
                                   </span>
                               </td>
                               <td class="px-6 py-4">
                                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                                       {{ product.status || 'active' }}
                                   </span>
                               </td>
                               <td class="px-6 py-4">
                                   <span :class="product.parent_product_id ? 'text-green-600' : 'text-slate-400'">
                                       {{ product.parent_product_id ? t('common.yes') : t('common.no') }}
                                   </span>
                               </td>
                           </tr>
                       </tbody>
                   </table>
              </div>
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
        <div class="p-4 bg-red-50 rounded-md text-red-700 text-sm">
            {{ t('products.delete.warning') }}
        </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';

const { t } = useI18n();
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Dialog from '../components/ui/Dialog.vue';
import TabContainer from '../components/ui/TabContainer.vue';
import { Plus, Search, Loader2, Trash2, Pencil, Package, ShoppingCart } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

// Tab state
const activeTab = ref(0);

// Parent Products Tab State
const parentProducts = ref<any[]>([]);
const parentLoading = ref(true);
const parentError = ref('');
const parentSearchQuery = ref('');
const selectedSeller = ref('');
const sellers = ref<any[]>([]);

// Marketplace Products Tab State
const marketplaceProducts = ref<any[]>([]);
const marketplaceLoading = ref(false);
const marketplaceError = ref('');
const marketplaceSearchQuery = ref('');

// Fetch sellers for filter
const fetchSellers = async () => {
    if (!authStore.isAdmin) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        console.error('Failed to load sellers', e);
    }
};

// Fetch Parent Products
const fetchParentProducts = async () => {
    try {
        parentLoading.value = true;
        const params: any = { search: parentSearchQuery.value };
        if (selectedSeller.value) {
            params.seller_id = selectedSeller.value;
        }
        const response = await api.get('/parent-products', { params });
        parentProducts.value = response.data;
        parentError.value = '';
    } catch (e) {
        parentError.value = 'Failed to load products';
        console.error(e);
    } finally {
        parentLoading.value = false;
    }
};

// Fetch Marketplace Products
const fetchMarketplaceProducts = async () => {
    try {
        marketplaceLoading.value = true;
        const params: any = { search: marketplaceSearchQuery.value };
        const response = await api.get('/marketplace-products', { params });
        marketplaceProducts.value = response.data;
        marketplaceError.value = '';
    } catch (e) {
        marketplaceError.value = 'Failed to load marketplace products';
        console.error(e);
    } finally {
        marketplaceLoading.value = false;
    }
};

const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat().format(Number(num));
};

// Delete functionality
const isDeleteDialogOpen = ref(false);
const productToDelete = ref<number | null>(null);

const confirmDelete = (id: number) => {
    productToDelete.value = id;
    isDeleteDialogOpen.value = true;
};

const deleteProduct = async () => {
    if (!productToDelete.value) return;
    try {
        await api.delete(`/parent-products/${productToDelete.value}`);
        fetchParentProducts();
        toast.success('Product deleted');
        isDeleteDialogOpen.value = false;
        productToDelete.value = null;
    } catch (e) {
        toast.error('Failed to delete product');
    }
};

onMounted(async () => {
    await fetchSellers();
    await fetchParentProducts();
});
</script>
