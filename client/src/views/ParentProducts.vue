<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Parent Products</h1>
        <p class="text-sm text-slate-500 mt-1">Manage your unified product catalog across all marketplaces</p>
      </div>
      <Button @click="openCreateModal">
        <Plus class="w-4 h-4 mr-2" />
        Create Parent Product
      </Button>
    </div>

    <!-- Search Field (Mandatory) -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by product name or description..." class="pl-9" v-model="searchQuery" @keyup.enter="fetchProducts" />
      </div>
      <Button class="w-auto" @click="fetchProducts">
        <Search class="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 flex justify-center text-slate-500">
        <Loader2 class="w-6 h-6 animate-spin mr-2" />
        Loading products...
      </div>
      <div v-else-if="products.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
        <Package class="w-8 h-8 text-slate-300 mb-3" />
        <h3 class="text-lg font-medium text-slate-900">No products found</h3>
        <p class="text-sm text-slate-500 mt-1">Create your first parent product to get started</p>
      </div>
      <table v-else class="w-full text-sm text-left">
        <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th class="px-6 py-4 font-medium">Product Name</th>
            <th class="px-6 py-4 font-medium">Stock</th>
            <th class="px-6 py-4 font-medium">Mapped SKUs</th>
            <th class="px-6 py-4 font-medium">Created At</th>
            <th class="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4 font-medium text-slate-900">
              {{ product.product_name }}
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                :class="product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                {{ product.stock }} units
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600">
              {{ product.mapped_count || 0 }} SKUs
            </td>
            <td class="px-6 py-4 text-slate-500 text-xs">
              {{ formatDate(product.created_at) }}
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <Button variant="ghost" size="icon" @click="openEditModal(product)" :title="'Edit'">
                <Pencil class="w-4 h-4 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" @click="deleteProduct(product.id)" class="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 class="w-4 h-4" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Product Dialog -->
    <Dialog 
      :isOpen="isEditDialogOpen" 
      :title="isEditMode ? 'Edit Parent Product' : 'Create Parent Product'" 
      description="Manage your unified product and map to marketplace SKUs"
      @close="closeEditModal"
      @confirm="saveProduct"
      :confirmText="isEditMode ? 'Update' : 'Create'"
      size="large"
    >
      <div class="space-y-6">
        <!-- Basic Info Section -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
          
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700">Product Name <span class="text-red-500">*</span></label>
            <Input v-model="formData.product_name" placeholder="Enter product name" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Stock <span class="text-red-500">*</span></label>
              <Input v-model.number="formData.stock" type="number" min="0" placeholder="0" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Cost (USD)</label>
              <Input v-model.number="formData.cost_usd" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700">Description</label>
            <textarea 
              v-model="formData.description" 
              class="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional product description"
            ></textarea>
          </div>
        </div>

        <!-- Mapping Section -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-slate-700 border-b pb-2">Marketplace Mapping</h3>
          
          <div v-for="(mapping, index) in formData.mappings" :key="index" class="border rounded-lg p-4 space-y-3 bg-slate-50">
            <div class="flex justify-between items-center">
              <p class="text-sm font-medium text-slate-700">Mapping #{{ index + 1 }}</p>
              <Button variant="ghost" size="sm" @click="removeMapping(index)" class="text-red-600 hover:bg-red-50">
                <X class="w-4 h-4" />
              </Button>
            </div>
            
            <div class="space-y-1">
              <label class="text-sm font-medium text-slate-700">Select Store</label>
              <select 
                v-model="mapping.store_id" 
                @change="loadMarketplaceProducts(index)"
                class="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a store...</option>
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name || store.store_name }} ({{ store.marketplace?.name || store.marketplace }})
                </option>
              </select>
            </div>
            
            <div v-if="mapping.store_id" class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Marketplace Products</label>
              <div class="max-h-40 overflow-y-auto border rounded-md bg-white">
                <div v-if="mapping.loading" class="p-4 text-center text-sm text-slate-500">
                  <Loader2 class="w-4 h-4 animate-spin inline mr-2" />
                  Loading products...
                </div>
                <div v-else-if="mapping.availableProducts?.length === 0" class="p-4 text-center text-sm text-slate-500">
                  No products available for this store
                </div>
                <label 
                  v-else
                  v-for="mp in mapping.availableProducts" 
                  :key="mp.id" 
                  class="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                >
                  <input 
                    type="checkbox" 
                    :value="mp.id" 
                    v-model="mapping.selected_products"
                    class="mr-3 rounded border-slate-300"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-medium text-slate-900">{{ mp.title }}</p>
                    <p class="text-xs text-slate-500">SKU: {{ mp.external_product_id }}</p>
                  </div>
                  <span class="text-xs text-slate-500">{{ mp.stock }} units</span>
                </label>
              </div>
            </div>
          </div>
          
          <Button variant="outline" @click="addMapping" class="w-full" type="button">
            <Plus class="w-4 h-4 mr-2" />
            Add Another Store Mapping
          </Button>
        </div>

        <!-- Warning for duplicate name -->
        <div v-if="duplicateWarning" class="p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <p class="text-sm text-yellow-800">⚠️ {{ duplicateWarning }}</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Dialog from '../components/ui/Dialog.vue';
import { Pencil, Trash2, Search, Loader2, Package, Plus, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const products = ref<any[]>([]);
const stores = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

const isEditDialogOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const duplicateWarning = ref('');

const formData = ref({
  product_name: '',
  stock: 0,
  cost_usd: 0,
  description: '',
  mappings: [] as any[],
});

const fetchProducts = async () => {
  try {
    loading.value = true;
    const params: any = {};
    if (searchQuery.value) params.search = searchQuery.value;
    const { data } = await api.get('/parent-products', { params });
    products.value = data;
  } catch (e) {
    console.error(e);
    toast.error('Failed to load products');
  } finally {
    loading.value = false;
  }
};

const fetchStores = async () => {
  try {
    const { data } = await api.get('/stores/my-stores');
    stores.value = data;
  } catch (e) {
    console.error('Failed to load stores', e);
  }
};

const openCreateModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  formData.value = {
    product_name: '',
    stock: 0,
    cost_usd: 0,
    description: '',
    mappings: [],
  };
  duplicateWarning.value = '';
  isEditDialogOpen.value = true;
};

const openEditModal = (product: any) => {
  isEditMode.value = true;
  editingId.value = product.id;
  formData.value = {
    product_name: product.product_name,
    stock: product.stock,
    cost_usd: product.cost_usd || 0,
    description: product.description || '',
    mappings: [], // Would load existing mappings in real implementation
  };
  duplicateWarning.value = '';
  isEditDialogOpen.value = true;
};

const closeEditModal = () => {
  isEditDialogOpen.value = false;
  duplicateWarning.value = '';
};

const addMapping = () => {
  formData.value.mappings.push({
    store_id: '',
    selected_products: [],
    availableProducts: [],
    loading: false,
  });
};

const removeMapping = (index: number) => {
  formData.value.mappings.splice(index, 1);
};

const loadMarketplaceProducts = async (index: number) => {
  const mapping = formData.value.mappings[index];
  if (!mapping.store_id) return;
  
  try {
    mapping.loading = true;
    const { data } = await api.get(`/stores/${mapping.store_id}/marketplace-products`);
    mapping.availableProducts = data;
  } catch (e) {
    console.error('Failed to load marketplace products', e);
    toast.error('Failed to load products for this store');
  } finally {
    mapping.loading = false;
  }
};

const saveProduct = async () => {
  if (!formData.value.product_name.trim()) {
    toast.error('Product name is required');
    return;
  }
  
  if (formData.value.stock < 0) {
    toast.error('Stock must be a non-negative number');
    return;
  }
  
  try {
    let response;
    if (isEditMode.value && editingId.value) {
      response = await api.put(`/parent-products/${editingId.value}`, formData.value);
      toast.success('Product updated');
    } else {
      response = await api.post('/parent-products', formData.value);
      
      // Check for duplicate warning
      if (response.data.warning) {
        duplicateWarning.value = response.data.warning;
        toast.warning(response.data.warning);
      } else {
        toast.success('Product created');
      }
    }
    
    if (!duplicateWarning.value) {
      isEditDialogOpen.value = false;
      fetchProducts();
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to save product');
  }
};

const deleteProduct = async (id: string) => {
  if (!confirm('Are you sure you want to archive this product? It will be hidden from your list but preserved for analytics.')) return;
  
  try {
    const { data } = await api.delete(`/parent-products/${id}`);
    if (data.success) {
      toast.success(data.message || 'Product archived');
      fetchProducts();
    } else {
      toast.error(data.message || 'Failed to archive product');
    }
  } catch (e: any) {
    toast.error(e.response?.data?.message || 'Failed to archive product');
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

onMounted(async () => {
  await fetchStores();
  await fetchProducts();
});
</script>
