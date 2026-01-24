<template>
  <div class="space-y-6 animate-fade-in">
       <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('sellers.title') }}</h1>
            <p class="text-sm text-muted-foreground mt-1">{{ t('sellers.subtitle') }}</p>
          </div>
          <Button @click="openCreateModal" class="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
               <Plus class="w-4 h-4 mr-2" />
               {{ t('sellers.add') }}
          </Button>
      </div>

      <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div v-if="loading" class="p-12 flex justify-center text-muted-foreground">
              <Loader2 class="w-8 h-8 animate-spin text-primary" />
          </div>
          <table v-else class="w-full text-sm text-left">
              <thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('sellers.table.name') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('sellers.table.contact') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('sellers.table.company') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('common.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-border">
                  <tr v-if="sellers.length === 0">
                      <td colspan="4" class="p-8 text-center text-muted-foreground">
                          {{ t('sellers.no_sellers') }}
                      </td>
                  </tr>
                  <tr v-for="seller in sellers" :key="seller.id" class="hover:bg-muted/50 transition-colors group">
                      <td class="px-6 py-4 font-medium text-foreground">
                          <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20">
                                  {{ seller.name?.substring(0,2).toUpperCase() }}
                              </div>
                              {{ seller.name }}
                          </div>
                      </td>
                      <td class="px-6 py-4 text-muted-foreground">
                          <div class="flex flex-col">
                              <span class="text-foreground">{{ seller.user?.email || '-' }}</span>
                              <span class="text-xs text-muted-foreground">{{ seller.phone_number || '-' }}</span>
                          </div>
                      </td>
                      <td class="px-6 py-4 text-muted-foreground">
                          {{ seller.name || '-' }}
                      </td>
                       <td class="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" @click="openEditModal(seller)" class="hover:bg-primary/10 hover:text-primary">
                              <Pencil class="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="deleteSeller(seller.id)" class="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 class="w-4 h-4" />
                          </Button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <Dialog 
        :isOpen="isDialogOpen" 
        :title="isEditMode ? t('sellers.dialog.edit_title') : t('sellers.dialog.add_title')" 
        :description="t('sellers.dialog.desc')"
        @close="isDialogOpen = false"
        @confirm="saveSeller"
      >
          <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                      <label class="text-sm font-medium text-foreground">{{ t('sellers.fields.name') }}</label>
                      <Input v-model="formData.name" :placeholder="t('sellers.fields.name_placeholder')" class="bg-background border-input focus:bg-background" />
                  </div>
                  <div class="space-y-1.5">
                      <label class="text-sm font-medium text-foreground">{{ t('sellers.fields.company') }}</label>
                      <Input v-model="formData.company_name" :placeholder="t('sellers.fields.company_placeholder')" class="bg-background border-input focus:bg-background" />
                  </div>
              </div>
              
              <div class="space-y-1.5">
                  <label class="text-sm font-medium text-foreground">{{ t('sellers.fields.email') }}</label>
                  <Input v-model="formData.email" type="email" :placeholder="t('sellers.fields.email_placeholder')" class="bg-background border-input focus:bg-background" />
              </div>

               <div class="space-y-1.5">
                  <label class="text-sm font-medium text-foreground">{{ t('sellers.fields.phone') }}</label>
                  <Input v-model="formData.phone" :placeholder="t('sellers.fields.phone_placeholder')" class="bg-background border-input focus:bg-background" />
              </div>

              <!-- Password field only for new users or optional for edit? Assuming seller creation might require auth setup elsewhere or basic here -->
              <div class="space-y-1.5" v-if="!isEditMode">
                  <label class="text-sm font-medium text-foreground">{{ t('sellers.fields.password') }}</label>
                  <Input v-model="formData.password" type="password" :placeholder="t('sellers.fields.password_placeholder')" class="bg-background border-input focus:bg-background" />
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
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const sellers = ref<any[]>([]);
const loading = ref(false);
const isDialogOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);

const formData = ref({ name: '', email: '', phone: '', company_name: '', password: '' });

const fetchSellers = async () => {
    loading.value = true;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) {
        toast.error(t('common.error_load_data'));
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    isEditMode.value = false;
    editingId.value = null;
    formData.value = { name: '', email: '', phone: '', company_name: '', password: '' };
    isDialogOpen.value = true;
};

const openEditModal = (seller: any) => {
    isEditMode.value = true;
    editingId.value = seller.id;
    formData.value = { 
        name: seller.name, 
        email: seller.email, 
        phone: seller.phone, 
        company_name: seller.company_name,
        password: '' // Don't fill password on edit
    };
    isDialogOpen.value = true;
};

const saveSeller = async () => {
    try {
        if (isEditMode.value && editingId.value) {
            await api.put(`/sellers/${editingId.value}`, formData.value);
            toast.success(t('common.success_saved'));
        } else {
            await api.post('/sellers', formData.value);
            toast.success(t('common.success_created'));
        }
        isDialogOpen.value = false;
        fetchSellers();
    } catch (e) {
        toast.error(t('common.error_generic'));
    }
};

const deleteSeller = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
        await api.delete(`/sellers/${id}`);
        toast.success(t('common.success_deleted'));
        fetchSellers();
    } catch (e) {
        toast.error(t('common.error_generic'));
    }
};

onMounted(fetchSellers);
</script>
