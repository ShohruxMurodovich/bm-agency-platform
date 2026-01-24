<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('products.return.title') }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('products.return.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-2" v-if="selectedProducts.length > 0">
               <span class="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full ring-1 ring-border">
                   {{ t('products.send.selected_count', { count: selectedProducts.length }) }}
               </span>
               <Button 
                  @click="submitReturn" 
                  :disabled="submitting || selectedProducts.length === 0"
                  class="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
               >
                  <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                  {{ submitting ? t('common.submitting') : t('products.return.create') }}
               </Button>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Product Selection -->
          <div class="lg:col-span-2 space-y-4">
              <!-- Search & Filters -->
              <div class="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
                  <div class="sm:w-1/3 relative">
                      <div class="relative">
                          <select 
                              v-model="selectedSellerId"
                              class="w-full pl-10 pr-10 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring focus:border-input appearance-none cursor-pointer transition-colors hover:bg-muted/50"
                              @change="fetchSellerProducts"
                          >
                              <option value="" disabled>{{ t('products.return.select_seller') }}</option>
                              <option v-for="seller in sellers" :key="seller.id" :value="seller.id">
                                  {{ seller.name }}
                              </option>
                          </select>
                          <Store class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                          <ChevronDown class="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                  </div>
                  <div class="relative flex-1">
                      <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                          :placeholder="t('common.search_products')" 
                          class="pl-10 h-10" 
                          v-model="searchQuery" 
                          :disabled="!selectedSellerId"
                      />
                  </div>
                  <Button 
                      variant="outline" 
                      @click="addAllVisible" 
                      class="whitespace-nowrap hidden sm:flex h-10"
                      :disabled="!selectedSellerId"
                  >
                      {{ t('common.add_all_visible') }}
                  </Button>
              </div>

              <!-- Products List -->
              <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                  <div v-if="!selectedSellerId" class="p-12 text-center text-muted-foreground">
                      <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users class="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p class="text-lg font-medium text-foreground">{{ t('products.return.select_seller_title') }}</p>
                      <p class="text-sm mt-1">{{ t('products.return.select_seller_desc') }}</p>
                  </div>
                  <div v-else-if="loading" class="p-12 flex justify-center text-muted-foreground">
                      <Loader2 class="w-8 h-8 animate-spin mr-2 text-primary" />
                      {{ t('common.loading_products') }}
                  </div>
                  <div v-else-if="filteredProducts.length === 0" class="p-12 text-center text-muted-foreground">
                      <Search class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p>{{ t('products.return.no_products_seller') }}</p>
                  </div>
                  <div v-else class="overflow-x-auto">
                      <table class="w-full text-sm text-left">
                          <thead class="text-xs text-muted-foreground uppercase bg-muted/80 border-b border-border sticky top-0 backdrop-blur-sm">
                              <tr>
                                  <th class="px-6 py-4 font-medium">{{ t('table.product') }}</th>
                                  <th class="px-6 py-4 font-medium text-right">{{ t('table.action') }}</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-border">
                              <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-muted/50 transition-colors group">
                                  <td class="px-6 py-4 font-medium text-foreground">
                                      {{ product.product_name }}
                                  </td>
                                  <td class="px-6 py-4 text-right">
                                      <Button 
                                          v-if="!isProductSelected(product.id)"
                                          @click="addProduct(product)"
                                          variant="secondary"
                                          size="sm"
                                          class="text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                                      >
                                          {{ t('common.select') }}
                                      </Button>
                                      <span v-else class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/20">
                                          <Check class="w-3.5 h-3.5" /> {{ t('common.added') }}
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
              <div class="bg-card rounded-xl border border-border shadow-sm p-6 sticky top-6 flex flex-col h-[calc(100vh-6rem)]">
                  <h3 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <ShoppingBag class="w-5 h-5 text-indigo-500" />
                      {{ t('products.return.summary') }}
                  </h3>
                  
                  <div v-if="selectedProducts.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border">
                      <PackageOpen class="w-10 h-10 text-muted-foreground/30 mb-2" />
                      <p class="text-sm font-medium">{{ t('products.return.empty_selection') }}</p>
                      <p class="text-xs text-muted-foreground/50 mt-1">{{ t('products.return.add_items_left') }}</p>
                  </div>

                  <div v-else class="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
                      <div v-for="item in selectedProducts" :key="item.product.id" 
                           class="group bg-card rounded-xl p-3 border border-border hover:border-indigo-500/30 hover:shadow-sm transition-all relative">
                          
                          <div class="flex justify-between items-start mb-3">
                              <span class="font-medium text-foreground text-sm leading-snug pr-6">{{ item.product.product_name }}</span>
                              <button @click="removeProduct(item.product.id)" class="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10">
                                  <X class="w-4 h-4" />
                              </button>
                          </div>
                          
                          <div class="flex items-center justify-between">
                              <span class="text-xs text-muted-foreground font-medium">QTY</span>
                              <div class="flex items-center bg-muted/50 rounded-lg border border-border p-0.5">
                                  <button @click="item.quantity > 1 ? item.quantity-- : removeProduct(item.product.id)" class="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-background rounded-md transition-all">
                                      <Minus class="w-3 h-3" />
                                  </button>
                                  <input 
                                      v-model.number="item.quantity"
                                      type="number"
                                      min="1"
                                      class="w-10 text-center text-sm border-0 p-0 focus:ring-0 text-foreground font-bold bg-transparent"
                                  />
                                  <button @click="item.quantity++" class="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-background rounded-md transition-all">
                                      <Plus class="w-3 h-3" />
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div class="border-t border-border pt-4 space-y-4 bg-card mt-auto">
                      <div class="space-y-1.5">
                          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.return.reason_notes') }}</label>
                          <textarea
                              v-model="notes"
                              rows="3"
                              :placeholder="t('products.return.reason_placeholder')"
                              class="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-input resize-none bg-background text-foreground transition-colors"
                          ></textarea>
                      </div>

                      <Button 
                          @click="submitReturn"
                          :disabled="selectedProducts.length === 0 || submitting"
                          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 h-11 text-sm rounded-lg"
                          size="lg"
                      >
                          <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                          <span v-else class="flex items-center">
                              {{ t('products.return.create') }}
                              <ArrowRight class="w-4 h-4 ml-2" />
                          </span>
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
import { Search, Loader2, X, Users, ChevronDown, Store, Check, Plus, Minus, PackageOpen, ShoppingBag, ArrowRight } from 'lucide-vue-next';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const { t } = useI18n();
const sellers = ref<any[]>([]);
const selectedSellerId = ref('');
const products = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const searchQuery = ref('');
const selectedProducts = ref<any[]>([]);
const notes = ref('');

onMounted(async () => {
    try {
        const response = await api.get('/sellers');
        sellers.value = response.data;
    } catch (error) {
        toast.error('Failed to load sellers');
    }
});

const fetchSellerProducts = async () => {
    if (!selectedSellerId.value) return;
    
    loading.value = true;
    selectedProducts.value = []; // Reset selection when changing seller
    try {
        const response = await api.get('/parent-products', {
            params: { seller_id: selectedSellerId.value }
        });
        products.value = response.data;
    } catch (error) {
        toast.error('Failed to load products');
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
    selectedProducts.value.push({
        product,
        quantity: 1
    });
};

const addAllVisible = () => {
    let addedCount = 0;
    filteredProducts.value.forEach(product => {
        if (!isProductSelected(product.id)) {
            addProduct(product);
            addedCount++;
        }
    });
    if (addedCount > 0) {
        toast.success(t('common.added_count', { count: addedCount }));
    }
};



const removeProduct = (productId: string) => {
    selectedProducts.value = selectedProducts.value.filter(p => p.product.id !== productId);
};

const submitReturn = async () => {
    if (selectedProducts.value.length === 0 || !selectedSellerId.value) return;

    submitting.value = true;
    try {
        const payload = {
            seller_id: selectedSellerId.value,
            products: selectedProducts.value.map(item => ({
                parent_product_id: item.product.id,
                quantity: item.quantity
            })),
            notes: notes.value
        };

        await api.post('/product-movement/return', payload);
        toast.success(t('products.send.success')); // Reuse or add new if needed
        
        // Reset form
        selectedProducts.value = [];
        notes.value = '';
    } catch (error) {
        console.error('Failed to create return:', error);
        toast.error(t('products.send.error')); // Reuse generic error
    } finally {
        submitting.value = false;
    }
};
</script>
