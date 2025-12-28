<template>
  <div class="space-y-6 animate-fade-in">
       <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('stores.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('stores.subtitle') }}</p>
          </div>
          <Button @click="openCreateModal" v-if="authStore.isAdmin">
               {{ t('stores.connect') }}
          </Button>
      </div>

      <!-- Search Field (Mandatory) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
          <div class="relative flex-1">
              <Search class="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input :placeholder="t('common.search_stores')" class="pl-9" v-model="searchQuery" @keyup.enter="fetchStores" />
          </div>
          <Button class="w-auto" @click="fetchStores">
              <Search class="w-4 h-4 mr-2" />
              {{ t('common.search') }}
          </Button>
      </div>

      <!-- Stores Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-slate-500">
              <Loader2 class="w-6 h-6 animate-spin mr-2" />
              {{ t('stores.loading') }}
          </div>
          <div v-else-if="stores.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-slate-500">
              <Store class="w-8 h-8 text-slate-300 mb-3" />
              <h3 class="text-lg font-medium text-slate-900">{{ t('stores.no_stores') }}</h3>
          </div>
          <table v-else class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.name') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.seller') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.marketplace') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.external_id') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.connection_status') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.last_sync') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('stores.table.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="store in stores" :key="store.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-medium text-slate-900">
                          {{ store.name || store.store_name }}
                      </td>
                      <td class="px-6 py-4 text-slate-600">
                          {{ store.seller?.name || store.user?.name || '—' }}
                      </td>
                      <td class="px-6 py-4">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                              {{ store.marketplace?.name || store.marketplace }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 font-mono text-xs">
                          {{ store.external_store_id || '—' }}
                      </td>
                      <td class="px-6 py-4">
                          <span 
                            :class="store.connection_status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'" 
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          >
                              <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="store.connection_status === 'connected' ? 'bg-green-500' : 'bg-red-500'"></span>
                              {{ store.connection_status || 'disconnected' }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 text-xs">
                          {{ store.last_sync_at ? formatDate(store.last_sync_at) : '—' }}
                      </td>
                       <td class="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" @click="openViewModal(store)" :title="t('common.view')">
                              <Eye class="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="openEditModal(store)" v-if="authStore.isAdmin">
                              <Pencil class="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="deleteStore(store.id)" class="text-red-600 hover:text-red-700 hover:bg-red-50" v-if="authStore.isAdmin">
                              <Trash2 class="w-4 h-4" />
                          </Button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <!-- View Store Dialog (Read-only) -->
      <Dialog 
        :isOpen="isViewDialogOpen" 
        :title="t('stores.dialog.view_title')" 
        :description="t('stores.dialog.view_desc')"
        @close="isViewDialogOpen = false"
        :showConfirm="false"
      >
          <div class="space-y-4" v-if="viewingStore">
              <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="text-slate-500">{{ t('stores.table.name') }}:</div>
                  <div class="font-medium text-slate-900">{{ viewingStore.store_name }}</div>
                  
                  <div class="text-slate-500">{{ t('stores.table.marketplace') }}:</div>
                  <div class="font-medium text-slate-900">{{ viewingStore.marketplace }}</div>
                  
                  <div class="text-slate-500">{{ t('stores.table.external_id') }}:</div>
                  <div class="font-medium text-slate-900 font-mono text-xs">{{ viewingStore.external_store_id }}</div>
                  
                  <div class="text-slate-500">{{ t('stores.table.seller') }}:</div>
                  <div class="font-medium text-slate-900">{{ viewingStore.seller?.name || viewingStore.user?.name || '—' }}</div>
                  
                  <div class="text-slate-500">{{ t('stores.table.connection_status') }}:</div>
                  <div class="font-medium capitalize">{{ viewingStore.connection_status || 'disconnected' }}</div>
                  
                  <div class="text-slate-500">{{ t('stores.table.last_sync') }}:</div>
                  <div class="font-medium">{{ viewingStore.last_sync_at ? formatDate(viewingStore.last_sync_at) : '—' }}</div>
              </div>
          </div>
      </Dialog>

      <!-- Edit Store Dialog -->
      <Dialog 
        :isOpen="isEditDialogOpen" 
        :title="isEditMode ? t('stores.dialog.edit_title') : t('stores.dialog.connect_title')" 
        :description="t('stores.dialog.desc')"
        @close="isEditDialogOpen = false"
        @confirm="saveStore"
      >
          <div class="space-y-4">
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('stores.dialog.marketplace_label') }}</label>
                  <select v-model="formData.marketplace" class="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="uzum">Uzum Market</option>
                      <option value="yandex">Yandex.Market GO</option>
                      <option value="wb">Wildberries</option>
                      <option value="ozon">Ozon</option>
                      <option value="alif">Alif Shop</option>
                  </select>
              </div>
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('stores.dialog.name_label') }}</label>
                  <Input v-model="formData.store_name" :placeholder="t('stores.dialog.name_placeholder')" />
              </div>
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('stores.dialog.external_id_label') }}</label>
                  <Input v-model="formData.external_store_id" :placeholder="t('stores.dialog.external_id_placeholder')" />
              </div>
              <div class="space-y-1" v-if="authStore.isAdmin">
                  <label class="text-sm font-medium text-slate-700">{{ t('stores.dialog.seller_label') }}</label>
                  <select v-model="formData.seller_id" class="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">{{ t('common.select_seller') }}</option>
                      <option v-for="seller in sellers" :key="seller.id" :value="seller.id">{{ seller.name }}</option>
                  </select>
              </div>
          </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import Dialog from '../components/ui/Dialog.vue';
import { Pencil, Trash2, Search, Loader2, Store, Eye } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const authStore = useAuthStore();

const stores = ref<any[]>([]);
const sellers = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

const isViewDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const viewingStore = ref<any | null>(null);

const formData = ref({ marketplace: 'uzum', store_name: '', external_store_id: '', seller_id: '' });

const fetchStores = async () => {
    try {
        loading.value = true;
        const params: any = {};
        if (searchQuery.value) params.search = searchQuery.value;
        const { data } = await api.get('/stores', { params });
        stores.value = data;
    } catch (e) {
        console.error(e);
        toast.error('Failed to load stores');
    } finally {
        loading.value = false;
    }
};

const fetchSellers = async () => {
    if (!authStore.isAdmin) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        console.error('Failed to load sellers', e);
    }
};

const openViewModal = (store: any) => {
    viewingStore.value = store;
    isViewDialogOpen.value = true;
};

const openCreateModal = () => {
    isEditMode.value = false;
    editingId.value = null;
    formData.value = { marketplace: 'uzum', store_name: '', external_store_id: '', seller_id: '' };
    isEditDialogOpen.value = true;
};

const openEditModal = (store: any) => {
    isEditMode.value = true;
    editingId.value = store.id;
    formData.value = { 
        marketplace: store.marketplace, 
        store_name: store.store_name, 
        external_store_id: store.external_store_id, 
        seller_id: store.seller?.id || store.user?.id || store.seller_id || '' 
    };
    isEditDialogOpen.value = true;
};

const saveStore = async () => {
    try {
        if (isEditMode.value && editingId.value) {
            await api.put(`/stores/${editingId.value}`, formData.value);
            toast.success('Store updated');
        } else {
            await api.post('/stores', formData.value);
            toast.success('Store connected');
        }
        isEditDialogOpen.value = false;
        fetchStores();
    } catch (e) {
        toast.error(t('common.save') + ' failed');
    }
};

const deleteStore = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
        await api.delete(`/stores/${id}`);
        toast.success('Store deleted');
        fetchStores();
    } catch (e) {
        toast.error(t('common.delete') + ' failed');
    }
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
};

onMounted(async () => {
    await fetchSellers();
    await fetchStores();
});
</script>
