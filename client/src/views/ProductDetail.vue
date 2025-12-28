<template>
  <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ isEdit ? t('products.edit_title') : t('products.new_title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('products.form_subtitle', { action: isEdit ? t('products.update_action') : t('products.create_action') }) }}</p>
          </div>
          <div class="flex gap-3">
              <Button variant="outline" @click="$router.back()">{{ t('common.cancel') }}</Button>
              <Button @click="saveProduct" :disabled="!canSave">{{ t('common.save') }}</Button>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Main Info -->
          <div class="lg:col-span-2 space-y-6">
              <!-- Seller Selection -->
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">{{ t('products.sections.seller') }}</h3>
                  <div class="space-y-2">
                      <label class="text-sm font-medium text-slate-700">{{ t('products.fields.select_seller') }} *</label>
                      <select v-model="form.seller_id" 
                              :disabled="isEdit"
                              class="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              @change="onSellerChange">
                          <option value="">{{ t('products.fields.select_seller_placeholder') }}</option>
                          <option v-for="seller in sellers" :key="seller.id" :value="seller.id">
                              {{ seller.name }}
                          </option>
                      </select>
                      <p v-if="isEdit" class="text-xs text-slate-500">{{ t('products.fields.seller_immutable') }}</p>
                  </div>
              </div>

              <!-- Basic Details Card -->
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">{{ t('products.sections.basic') }}</h3>
                  
                  <div class="space-y-2">
                       <label class="text-sm font-medium text-slate-700">{{ t('products.fields.product_name') }} *</label>
                       <Input v-model="form.product_name" :placeholder="t('products.fields.product_name_placeholder')" />
                  </div>

                  <div class="space-y-2">
                      <label class="text-sm font-medium text-slate-700">{{ t('products.fields.description') }}</label>
                      <textarea 
                        v-model="form.description"
                        class="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px]"
                        :placeholder="t('products.fields.description_placeholder')"
                      ></textarea>
                  </div>
              </div>

               <!-- Cost & Stock Card -->
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">{{ t('products.sections.cost_stock') }}</h3>
                  
                  <div class="grid grid-cols-3 gap-4">
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-slate-700">{{ t('products.fields.cost_usd') }}</label>
                           <Input v-model.number="form.cost_usd" type="number" step="0.01" placeholder="0.00" />
                      </div>
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-slate-700">{{ t('products.fields.cost_uzs') }}</label>
                           <Input v-model.number="form.cost_uzs" type="number" placeholder="0" />
                      </div>
                      <div class="space-y-2">
                           <label class="text-sm font-medium text-slate-700">{{ t('products.fields.stock') }} *</label>
                           <Input v-model.number="form.stock" type="number" placeholder="0" min="0" />
                      </div>
                  </div>
                  <p class="text-xs text-slate-500 mt-2">
                      {{ t('products.fields.stock_hint') }}
                  </p>
              </div>
          </div>

          <!-- Right Column: Info -->
          <div class="space-y-6">
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                   <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">{{ t('products.sections.info') }}</h3>
                   
                   <div class="text-sm text-slate-600 space-y-3">
                       <div class="flex items-start">
                           <div class="mt-0.5 mr-3 p-1.5 bg-amber-50 rounded-lg">
                               <Package class="w-5 h-5 text-amber-600" />
                           </div>
                           <div>
                               <div class="font-medium text-slate-900">{{ t('products.fields.info_parent_title') }}</div>
                               <p class="text-xs mt-1">{{ t('products.fields.info_parent_desc') }}</p>
                           </div>
                       </div>
                       <div class="flex items-start mt-4">
                           <div class="mt-0.5 mr-3 p-1.5 bg-blue-50 rounded-lg">
                               <BarChart3 class="w-5 h-5 text-blue-600" />
                           </div>
                           <div>
                               <div class="font-medium text-slate-900">{{ t('products.fields.info_stock_title') }}</div>
                               <p class="text-xs mt-1">{{ t('products.fields.info_stock_desc') }}</p>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      <!-- Inventory Section (Read-Only) -->
      <div v-if="isEdit" class="space-y-4">
           <h2 class="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Inventory Management</h2>
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
import { Package, BarChart3 } from 'lucide-vue-next';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
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

const fetchSellers = async () => {
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        console.error('Failed to fetch sellers');
        toast.error('Failed to load sellers');
    }
};

const onSellerChange = () => {
    // Future: Load seller's stores for marketplace product linking
};

onMounted(async () => {
    await fetchSellers();
    
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
    }
});

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
</script>
