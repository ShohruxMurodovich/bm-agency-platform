<template>
  <div class="space-y-6 animate-fade-in">
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

      <!-- Filters & Search Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
              <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input :placeholder="t('common.search_products')" class="pl-9" v-model="searchQuery" @keyup.enter="fetchProducts" />
          </div>
          <div class="flex items-center gap-2">
               <!-- Placeholder for Filters -->
               <Button class="w-full sm:w-auto" @click="fetchProducts">
                   <Search class="w-4 h-4 mr-2" />
                   {{ t('common.search') }}
               </Button>
          </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-slate-500">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('products.loading') }}
          </div>
          <div v-else-if="error" class="p-8 text-center text-red-500">{{ error }}</div>
          <div v-else-if="products.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <Search class="w-8 h-8 text-slate-300 mb-3" />
              <h3 class="text-lg font-medium text-slate-900">{{ t('common.no_products_found') }}</h3>
              <p class="text-sm mt-1" v-if="currentSearch">
                  {{ t('common.no_products_found_query', { query: currentSearch }) }}
              </p>
              <p class="text-sm mt-1" v-else>
                  {{ t('products.empty_start') }}
              </p>
          </div>
          <div v-else class="overflow-x-auto">
               <table class="w-full text-sm text-left">
                   <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                       <tr>
                           <th class="px-6 py-4 font-medium">{{ t('table.product_name') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.seller') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.cost_usd') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.cost_uzs') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.stock') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.linked') }}</th>
                           <th class="px-6 py-4 font-medium">{{ t('table.created') }}</th>
                           <th class="px-6 py-4 font-medium text-right">{{ t('table.action') }}</th>
                       </tr>
                   </thead>
                   <tbody class="divide-y divide-slate-100">
                       <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50/50 transition-colors group">
                           <td class="px-6 py-4 font-medium text-slate-900 border-l-4 border-transparent hover:border-indigo-500 transition-all">
                               {{ product.product_name }}
                           </td>
                           <td class="px-6 py-4 text-slate-600">
                               <span v-if="product.seller">{{ product.seller.name }}</span>
                               <span v-else class="text-slate-400">—</span>
                           </td>
                           <td class="px-6 py-4 text-slate-900">
                               <span v-if="product.cost_usd">${{ product.cost_usd }}</span>
                               <span v-else class="text-slate-400">—</span>
                           </td>
                           <td class="px-6 py-4 text-slate-900">
                               <span v-if="product.cost_uzs">{{ formatNumber(product.cost_uzs) }} UZS</span>
                               <span v-else class="text-slate-400">—</span>
                           </td>
                           <td class="px-6 py-4">
                               <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                     :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                   {{ product.stock || 0 }}
                               </span>
                           </td>
                           <td class="px-6 py-4 text-slate-600">
                               <span class="text-indigo-600 font-medium">{{ product.linked_count || 0 }}</span> {{ t('table.product').toLowerCase() }}s
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
          <!-- Pagination Footer -->
          <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>{{ t('products.send.selected_count', { count: products.length }).replace('selected', '') }} items</span>
              <div class="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
          </div>
      </div>

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
import { Plus, Search, Loader2, Trash2, Pencil } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const products = ref<any[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const currentSearch = ref('');

const fetchProducts = async () => {
    try {
        currentSearch.value = searchQuery.value;
        const response = await api.get('/parent-products', { params: { search: searchQuery.value } });
        products.value = response.data;
    } catch (e) {
        error.value = 'Failed to load products';
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat().format(Number(num));
};

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
        fetchProducts();
        toast.success('Product deleted');
        isDeleteDialogOpen.value = false;
        productToDelete.value = null;
    } catch (e) {
        toast.error('Failed to delete product');
    }
};

onMounted(() => {
    fetchProducts();
});
</script>
