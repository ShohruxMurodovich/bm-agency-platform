<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('products.send.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('products.send.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2" v-if="selectedProducts.length > 0">
               <span class="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                   {{ t('products.send.selected_count', { count: selectedProducts.length }) }}
               </span>
               <Button 
                  @click="submitRequest" 
                  :disabled="submitting || selectedProducts.length === 0"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white"
               >
                  <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                  {{ submitting ? t('common.sending') : t('common.send_request') }}
               </Button>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Product Selection -->
          <div class="lg:col-span-2 space-y-4">
              <!-- Search Bar -->
              <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                  <div class="relative flex-1">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input :placeholder="t('common.search_products')" class="pl-9" v-model="searchQuery" />
                  </div>
                  <Button variant="outline" @click="addAllVisible" class="whitespace-nowrap hidden sm:flex">
                      {{ t('common.add_all_visible') }}
                  </Button>
              </div>

              <!-- Products List -->
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                  <div v-if="loading" class="p-12 flex justify-center text-slate-500">
                      <Loader2 class="w-6 h-6 animate-spin mr-2" />
                      {{ t('common.loading_products') }}
                  </div>
                  <div v-else-if="filteredProducts.length === 0" class="p-12 text-center text-slate-500">
                      <Search class="w-8 h-8 mx-auto mb-3 text-slate-300" />
                      <p>{{ t('common.no_products_found_query', { query: searchQuery }) }}</p>
                  </div>
                  <div v-else class="overflow-x-auto">
                      <table class="w-full text-sm text-left">
                          <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                              <tr>
                                  <th class="px-6 py-4 font-medium">{{ t('table.product') }}</th>
                                  <th class="px-6 py-4 font-medium">{{ t('table.available') }}</th>
                                  <th class="px-6 py-4 font-medium text-right">{{ t('table.action') }}</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100">
                              <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-slate-50/50 transition-colors group">
                                  <td class="px-6 py-4 font-medium text-slate-900">
                                      {{ product.product_name }}
                                  </td>
                                  <td class="px-6 py-4">
                                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            :class="product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                          {{ product.stock || 0 }}
                                      </span>
                                  </td>
                                  <td class="px-6 py-4 text-right">
                                      <Button 
                                          v-if="!isProductSelected(product.id)"
                                          @click="addProduct(product)"
                                          variant="ghost"
                                          size="sm"
                                          class="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                      >
                                          {{ t('common.select') }}
                                      </Button>
                                      <span v-else class="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                          ✓ {{ t('common.added') }}
                                      </span>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          <!-- Right Column: Summary (Sticky) -->
          <div class="lg:col-span-1">
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-6 space-y-6">
                  <h3 class="text-lg font-bold text-slate-900">{{ t('products.send.selected_items') }}</h3>
                  
                  <div v-if="selectedProducts.length === 0" class="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p class="text-sm">{{ t('products.send.empty_selection') }}</p>
                  </div>

                  <div v-else class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div v-for="item in selectedProducts" :key="item.product.id" 
                           class="bg-slate-50 rounded-lg p-3 border border-slate-100 transition-all hover:border-indigo-100 flex flex-col gap-3">
                          
                          <div class="flex justify-between items-start">
                              <span class="font-medium text-slate-900 text-sm truncate pr-2">{{ item.product.product_name }}</span>
                              <button @click="removeProduct(item.product.id)" class="text-slate-400 hover:text-red-500 transition-colors p-1">
                                  <X class="w-4 h-4" />
                              </button>
                          </div>
                          
                          <div class="flex items-center justify-between gap-3 bg-white p-2 rounded border border-slate-200">
                              <div class="text-xs text-slate-500 font-medium pl-1">
                                  Stock: {{ item.product.stock }}
                              </div>
                              <div class="flex items-center gap-2">
                                  <button @click="setMaxQuantity(item)" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded hover:bg-indigo-100 uppercase tracking-wide">
                                      MAX
                                  </button>
                                  <div class="h-4 w-px bg-slate-200"></div>
                                  <input 
                                      v-model.number="item.quantity"
                                      type="number"
                                      min="1"
                                      :max="item.product.stock"
                                      class="w-16 text-right text-sm border-0 p-0 focus:ring-0 text-slate-900 font-bold"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div class="border-t pt-4 space-y-4">
                      <div class="space-y-2">
                          <label class="text-sm font-medium text-slate-700">{{ t('common.notes_optional') }}</label>
                          <textarea
                              v-model="notes"
                              rows="3"
                              :placeholder="t('common.notes_placeholder')"
                              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          ></textarea>
                      </div>

                      <Button 
                          @click="submitRequest"
                          :disabled="selectedProducts.length === 0 || submitting"
                          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                          size="lg"
                      >
                          <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                          {{ submitting ? t('products.send.submit') : t('products.send.submit') }}
                      </Button>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { toast } from 'vue-sonner';
import { Search, Loader2, X } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const { t } = useI18n();
const products = ref<any[]>([]);
const loading = ref(true);
const submitting = ref(false);
const searchQuery = ref('');
const selectedProducts = ref<any[]>([]);
const notes = ref('');

onMounted(() => {
    fetchProducts();
});

const fetchProducts = async () => {
    try {
        const response = await api.get('/parent-products');
        products.value = response.data;
    } catch (error) {
        toast.error(t('common.error_load_products'));
    } finally {
        loading.value = false;
    }
};

const filteredProducts = computed(() => {
    if (!searchQuery.value) return products.value;
    const query = searchQuery.value.toLowerCase();
    return products.value.filter(p => p.product_name.toLowerCase().includes(query));
});

const isProductSelected = (productId: string) => {
    return selectedProducts.value.some(p => p.product.id === productId);
};

const addProduct = (product: any) => {
    if (product.stock <= 0) {
        toast.error(t('common.out_of_stock'));
        return;
    }
    selectedProducts.value.push({
        product,
        quantity: 1
    });
};

const addAllVisible = () => {
    let addedCount = 0;
    filteredProducts.value.forEach(product => {
        if (!isProductSelected(product.id) && product.stock > 0) {
            addProduct(product);
            addedCount++;
        }
    });
    if (addedCount > 0) {
        toast.success(t('common.added_count', { count: addedCount }));
    }
};

const setMaxQuantity = (item: any) => {
    item.quantity = item.product.stock;
};

const removeProduct = (productId: string) => {
    selectedProducts.value = selectedProducts.value.filter(p => p.product.id !== productId);
};

const submitRequest = async () => {
    if (selectedProducts.value.length === 0) return;

    submitting.value = true;
    try {
        const payload = {
            products: selectedProducts.value.map(item => ({
                parent_product_id: item.product.id,
                quantity: item.quantity
            })),
            notes: notes.value
        };

        await api.post('/product-movement/send', payload);
        toast.success(t('products.send.success'));
        
        // Reset form
        selectedProducts.value = [];
        notes.value = '';
    } catch (error) {
        console.error('Failed to create request:', error);
        toast.error(t('products.send.error'));
    } finally {
        submitting.value = false;
    }
};
</script>
