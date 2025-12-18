<template>
  <div class="space-y-6 animate-fade-in">
       <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('users.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('users.subtitle') }}</p>
          </div>
          <Button @click="openDialog()">
               {{ t('users.invite') }}
          </Button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('users.table.user') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('users.table.role') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('users.table.joined') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('users.table.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4">
                          <div class="flex items-center">
                              <div class="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold mr-3 text-xs">
                                  {{ user.email.substring(0,2).toUpperCase() }}
                              </div>
                              <div>
                                  <div class="font-medium text-slate-900">{{ user.email }}</div>
                                  <div class="text-xs text-slate-500">User Account</div>
                              </div>
                          </div>
                      </td>
                      <td class="px-6 py-4">
                          <span :class="getRoleColor(user.role)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase border">
                              {{ t('users.roles.' + user.role) }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-slate-500 text-xs">
                          {{ new Date(user.created_at).toLocaleDateString() }}
                      </td>
                       <td class="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="icon" @click="openDialog(user)">
                              <Pencil class="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" @click="confirmDelete(user.id)" class="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 class="w-4 h-4" />
                          </Button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <Dialog 
        :isOpen="isDialogOpen" 
        :title="isEdit ? t('users.dialog.edit_title') : t('users.dialog.invite_title')" 
        :description="isEdit ? t('users.dialog.edit_desc') : t('users.dialog.invite_desc')"
        @close="isDialogOpen = false"
        @confirm="saveUser"
      >
          <div class="space-y-4">
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('users.dialog.email_label') }}</label>
                  <Input v-model="form.email" type="email" placeholder="alice@platform.com" />
              </div>
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('users.dialog.role_label') }}</label>
                   <select v-model="form.role" class="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                       <option value="staff">{{ t('users.roles.staff') }}</option>
                       <option value="seller">{{ t('users.roles.seller') }}</option>
                       <option value="courier">{{ t('users.roles.courier') }}</option>
                       <option value="admin">{{ t('users.roles.admin') }}</option>
                   </select>
              </div>
              <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">{{ t('users.dialog.password_label') }}</label>
                  <Input v-model="form.password" type="password" :placeholder="isEdit ? t('users.dialog.password_placeholder') : '••••••••'" />
              </div>
              <div class="p-3 bg-blue-50 rounded-md text-blue-700 text-xs">
                  💡 {{ t('users.dialog.note') }}
              </div>
          </div>
      </Dialog>
      
      <Dialog 
        :isOpen="isDeleteDialogOpen" 
        :title="t('users.delete.title')" 
        :description="t('users.delete.desc')"
        @close="isDeleteDialogOpen = false"
        @confirm="deleteUser"
      >
        <div class="p-4 bg-red-50 rounded-md text-red-700 text-sm">
            {{ t('users.delete.warning') }}
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
import { toast } from 'vue-sonner';
import { Trash2, Pencil } from 'lucide-vue-next';

const { t } = useI18n();
const users = ref<any[]>([]);
const isDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isEdit = ref(false);
const form = ref({ id: '', email: '', password: '', role: 'staff' });
const userToDelete = ref<string | null>(null);

const fetchUsers = async () => {
    try {
        const { data } = await api.get('/users'); 
        users.value = data;
    } catch (e) {
        console.error('Failed to fetch users', e);
        toast.error('Failed to load users');
    }
};

const openDialog = (user?: any) => {
    if (user) {
        isEdit.value = true;
        // Don't show password hash in form
        form.value = { id: user.id, email: user.email, password: '', role: user.role }; 
    } else {
        isEdit.value = false;
        form.value = { id: '', email: '', password: '', role: 'staff' };
    }
    isDialogOpen.value = true;
};

const saveUser = async () => {
    try {
        if (isEdit.value) {
            await api.put(`/users/${form.value.id}`, form.value);
            toast.success('User updated successfully');
        } else {
            // Don't send id field when creating new user
            const { id, ...userData } = form.value;
            await api.post('/users', userData);
            toast.success('User invited successfully');
        }
        isDialogOpen.value = false;
        fetchUsers();
    } catch (e: any) {
        const errorMsg = e.response?.data?.message || (isEdit.value ? 'Failed to update user' : 'Failed to invite user');
        toast.error(errorMsg);
    }
};

const confirmDelete = (id: string) => {
    userToDelete.value = id;
    isDeleteDialogOpen.value = true;
};

const deleteUser = async () => {
    if (!userToDelete.value) return;
    try {
        await api.delete(`/users/${userToDelete.value}`);
        fetchUsers();
        toast.success('User deleted');
        isDeleteDialogOpen.value = false;
        userToDelete.value = null;
    } catch (e) {
        toast.error('Failed to delete user');
    }
}

const getRoleColor = (role: string) => {
    switch(role) {
        case 'admin': return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'staff': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'seller': return 'bg-orange-50 text-orange-700 border-orange-200';
        default: return 'bg-slate-100';
    }
}

onMounted(fetchUsers);
</script>
