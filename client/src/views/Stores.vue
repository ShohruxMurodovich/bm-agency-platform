<template>
  <div class="space-y-6 animate-fade-in">
       <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('stores.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('stores.subtitle') }}</p>
          </div>
          <Button @click="openCreateModal">
               {{ t('stores.connect') }}
          </Button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.name') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.marketplace') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('stores.table.owner') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('stores.table.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="store in stores" :key="store.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-medium text-slate-900">
                          {{ store.name || store.store_name }}
                      </td>
                      <td class="px-6 py-4">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                              {{ store.marketplace?.name || store.marketplace }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600">
                          {{ store.user?.name || store.user_id || 'Self' }}
                      </td>
                       <td class="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" @click="openEditModal(store)">
                              <Pencil class="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="deleteStore(store.id)" class="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 class="w-4 h-4" />
                          </Button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <Dialog 
        :isOpen="isDialogOpen" 
        :title="isEditMode ? t('stores.dialog.edit_title') : t('stores.dialog.connect_title')" 
        :description="t('stores.dialog.desc')"
        @close="isDialogOpen = false"
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
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('stores.dialog.owner_label') }}</label>
                   <!-- Ideally a select dropdown of sellers -->
                  <Input v-model="formData.user_id" :placeholder="t('stores.dialog.owner_placeholder')" />
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
import { Pencil, Trash2 } from 'lucide-vue-next';

const { t } = useI18n();
const stores = ref<any[]>([]);
const isDialogOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);

const formData = ref({ marketplace: 'uzum', store_name: '', external_store_id: '', user_id: '' });

const fetchStores = async () => {
    try {
        const { data } = await api.get('/stores');
        stores.value = data;
    } catch (e) {
        console.error(e);
    }
};

const openCreateModal = () => {
    isEditMode.value = false;
    editingId.value = null;
    formData.value = { marketplace: 'uzum', store_name: '', external_store_id: '', user_id: '' };
    isDialogOpen.value = true;
};

const openEditModal = (store: any) => {
    isEditMode.value = true;
    editingId.value = store.id;
    formData.value = { 
        marketplace: store.marketplace, 
        store_name: store.store_name, 
        external_store_id: store.external_store_id, 
        user_id: store.user?.id || store.user_id 
    };
    isDialogOpen.value = true;
};

const saveStore = async () => {
    try {
        if (isEditMode.value && editingId.value) {
            await api.put(`/stores/${editingId.value}`, formData.value);
        } else {
            await api.post('/stores', formData.value);
        }
        isDialogOpen.value = false;
        fetchStores();
    } catch (e) {
        alert(t('common.save') + ' failed');
    }
};

const deleteStore = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
        await api.delete(`/stores/${id}`);
        fetchStores();
    } catch (e) {
        alert(t('common.delete') + ' failed');
    }
};

onMounted(fetchStores);
</script>
