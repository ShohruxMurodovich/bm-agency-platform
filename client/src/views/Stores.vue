<template>
  <div class="space-y-6 animate-fade-in">

    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('stores.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ t('stores.subtitle') }}</p>
        <p v-if="authStore.user?.role === 'public_user' && storeLimit" class="text-xs mt-1"
           :class="storeLimit.current >= storeLimit.max ? 'text-red-600 font-semibold' : 'text-muted-foreground'">
          {{ storeLimit.current }}/{{ storeLimit.max }} stores connected
        </p>
      </div>
      <Button @click="openWizard">
        <Plus class="w-4 h-4 mr-2" />
        {{ t('stores.connect') }}
      </Button>
    </div>

    <!-- Search -->
    <div class="bg-card p-4 rounded-xl border border-border shadow-sm flex gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input :placeholder="t('common.search_stores')" class="pl-9" v-model="searchQuery" @keyup.enter="fetchStores" />
      </div>
      <Button class="w-auto" variant="outline" @click="fetchStores">{{ t('common.search') }}</Button>
    </div>

    <!-- Stores Table -->
    <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 flex justify-center items-center gap-2 text-muted-foreground">
        <Loader2 class="w-5 h-5 animate-spin" />
        {{ t('stores.loading') }}
      </div>
      <div v-else-if="stores.length === 0" class="p-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
        <div class="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Store class="w-7 h-7 opacity-40" />
        </div>
        <div>
          <p class="font-medium text-foreground">{{ t('stores.no_stores') }}</p>
          <p class="text-sm mt-1">Click "Connect Store" to add your first marketplace store.</p>
        </div>
      </div>
      <table v-else class="w-full text-sm text-left">
        <thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border tracking-wider">
          <tr>
            <th class="px-6 py-3 font-medium">Display Name</th>
            <th class="px-6 py-3 font-medium">Marketplace</th>
            <th class="px-6 py-3 font-medium">Store ID</th>
            <th class="px-6 py-3 font-medium" v-if="authStore.isAdmin || authStore.isStaff">Seller</th>
            <th class="px-6 py-3 font-medium">Status</th>
            <th class="px-6 py-3 font-medium">Connected</th>
            <th class="px-6 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="store in stores" :key="store.id" class="hover:bg-muted/30 transition-colors">

            <!-- Display name -->
            <td class="px-6 py-4 font-medium text-foreground">
              {{ store.display_name || store.name || store.store_name || '—' }}
            </td>

            <!-- Marketplace badge -->
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted border border-border text-foreground uppercase">
                <MarketplaceLogo :marketplace="getMarketplaceCode(store)" size="sm" />
                {{ store.marketplace?.name || getMarketplaceCode(store) }}
              </span>
            </td>

            <!-- Store ID -->
            <td class="px-6 py-4 font-mono text-xs text-muted-foreground">
              {{ store.external_shop_id || '—' }}
            </td>

            <!-- Seller (Admin/Staff only) -->
            <td v-if="authStore.isAdmin || authStore.isStaff" class="px-6 py-4 text-muted-foreground text-xs">
              {{ store.seller?.name || '—' }}
            </td>

            <!-- Status badge -->
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                    :class="statusClass(store.connection_status)">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(store.connection_status)"></span>
                {{ store.connection_status || 'unknown' }}
              </span>
            </td>

            <!-- Date -->
            <td class="px-6 py-4 text-muted-foreground text-xs">
              {{ store.created_at ? formatDate(store.created_at) : '—' }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <!-- Edit display name -->
                <button @click="openEditName(store)" title="Edit display name"
                        class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil class="w-3.5 h-3.5" />
                </button>

                <!-- Update token / Reconnect -->
                <button @click="openUpdateToken(store)"
                        :title="getMarketplaceCode(store) === 'uzum' ? 'Reconnect' : 'Update Token'"
                        class="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                  <RefreshCw class="w-3.5 h-3.5" />
                </button>

                <!-- Disable / Enable -->
                <button v-if="store.connection_status !== 'disabled'" @click="toggleDisable(store)" title="Disable store"
                        class="p-1.5 rounded-md hover:bg-amber-500/10 transition-colors text-muted-foreground hover:text-amber-600">
                  <PauseCircle class="w-3.5 h-3.5" />
                </button>
                <button v-else @click="toggleDisable(store)" title="Enable store"
                        class="p-1.5 rounded-md hover:bg-green-500/10 transition-colors text-muted-foreground hover:text-green-600">
                  <PlayCircle class="w-3.5 h-3.5" />
                </button>

                <!-- Delete (Admin only) -->
                <button v-if="authStore.isAdmin" @click="deleteStore(store.id)" title="Delete store"
                        class="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ Connect Store Wizard ═══ -->
    <ConnectStoreWizard
      :isOpen="showWizard"
      :sellers="sellers"
      @close="showWizard = false"
      @connected="onStoreConnected"
    />

    <!-- ═══ Edit Display Name Modal ═══ -->
    <Dialog :isOpen="showEditName" title="Edit Display Name" @close="showEditName = false" @confirm="saveDisplayName">
      <div class="space-y-3">
        <label class="text-sm font-medium text-foreground">New display name *</label>
        <input v-model="editNameValue" type="text" placeholder='e.g. "Store A Uzum"'
               class="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" />
        <p v-if="editNameWarning" class="text-xs text-amber-600 flex items-center gap-1">
          <span>⚠</span> {{ editNameWarning }}
        </p>
      </div>
    </Dialog>

    <!-- ═══ Update Token Modal ═══ -->
    <Dialog :isOpen="showUpdateToken" :title="updateTokenMarketplace === 'uzum' ? 'Reconnect Uzum' : 'Update Token'"
            @close="showUpdateToken = false" @confirm="saveToken">
      <div class="space-y-4">
        <div class="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
          {{ updateTokenStoreName }} · <span class="font-mono">{{ updateTokenStoreId }}</span>
        </div>

        <!-- Global error -->
        <p v-if="tokenError" class="text-sm text-destructive">{{ tokenError }}</p>

        <!-- Uzum: email + password flow -->
        <template v-if="updateTokenMarketplace === 'uzum'">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Uzum Email</label>
            <input v-model="uzumEmail" type="email" class="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Uzum Password</label>
            <input v-model="uzumPassword" type="password" class="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
            <p class="text-xs text-muted-foreground mt-1">Not stored.</p>
          </div>
          <button @click="getUzumTokenForUpdate" :disabled="gettingToken"
                  class="w-full h-9 rounded-lg border border-border bg-muted text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Loader2 v-if="gettingToken" class="w-3.5 h-3.5 animate-spin" />
            <Zap v-else class="w-3.5 h-3.5 text-primary" />
            {{ gettingToken ? 'Getting token...' : 'Get Token' }}
          </button>
          <p v-if="newToken" class="text-xs text-green-600 font-medium">✓ Token retrieved</p>
        </template>

        <!-- WB/Yandex: manual token -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">New API Token</label>
            <div class="relative">
              <input v-model="newToken" :type="showNewToken ? 'text' : 'password'"
                     placeholder="Paste new token"
                     class="w-full h-9 rounded-lg border border-input bg-background px-3 pr-10 text-sm" />
              <button @click="showNewToken = !showNewToken" type="button"
                      class="absolute right-3 top-2 text-muted-foreground">
                <Eye v-if="!showNewToken" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ t('stores.token_description') }}</p>
          </div>
        </template>
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
import ConnectStoreWizard from '../components/stores/ConnectStoreWizard.vue';
import { Plus, Pencil, Trash2, Search, Loader2, Store, RefreshCw, PauseCircle, PlayCircle, Eye, EyeOff, Zap } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { toast } from 'vue-sonner';
import MarketplaceLogo from '../components/stores/MarketplaceLogo.vue';

const { t } = useI18n();
const authStore = useAuthStore();

const stores = ref<any[]>([]);
const sellers = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const storeLimit = ref<{ current: number; max: number } | null>(null);
const showWizard = ref(false);

// Edit name modal
const showEditName = ref(false);
const editingStoreId = ref('');
const editNameValue = ref('');
const editNameWarning = ref('');

// Update token modal
const showUpdateToken = ref(false);
const updatingStoreId = ref('');
const updateTokenMarketplace = ref('');
const updateTokenStoreName = ref('');
const updateTokenStoreId = ref('');
const newToken = ref('');
const showNewToken = ref(false);
const tokenError = ref('');
const gettingToken = ref(false);
const uzumEmail = ref('');
const uzumPassword = ref('');

// ── Fetch ──────────────────────────────────────────────────────
const fetchStores = async () => {
    loading.value = true;
    try {
        const params: any = {};
        if (searchQuery.value) params.search = searchQuery.value;
        const { data } = await api.get('/stores', { params });
        stores.value = data;
    } catch (e) {
        toast.error('Failed to load stores');
    } finally {
        loading.value = false;
    }
};

const fetchSellers = async () => {
    if (!authStore.isAdmin && !authStore.isStaff) return;
    try {
        const { data } = await api.get('/sellers');
        sellers.value = data;
    } catch (e) { console.error(e); }
};

const fetchStoreLimit = async () => {
    if (authStore.user?.role !== 'public_user') return;
    try {
        const { data } = await api.get('/stores');
        const max = (authStore.user as any)?.max_stores ?? 3;
        storeLimit.value = { current: data.length, max };
    } catch (e) { console.error(e); }
};

// ── Wizard ─────────────────────────────────────────────────────
const openWizard = () => { showWizard.value = true; };
const onStoreConnected = () => {
    fetchStores();
    fetchStoreLimit();
};

// ── Status helpers ─────────────────────────────────────────────
const statusClass = (status: string) => {
    if (status === 'connected') return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (status === 'expired') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    return 'bg-muted text-muted-foreground';
};
const statusDot = (status: string) => {
    if (status === 'connected') return 'bg-green-500';
    if (status === 'expired') return 'bg-amber-500';
    return 'bg-muted-foreground';
};

const mpCodeFromId: Record<number, string> = { 1: 'wb', 2: 'ozon', 3: 'yandex', 4: 'aliexpress', 5: 'uzum', 6: 'alif' };
const getMarketplaceCode = (store: any): string => mpCodeFromId[store.marketplace_id] ?? store.marketplace?.code ?? '';

// ── Edit display name ──────────────────────────────────────────
const openEditName = (store: any) => {
    editingStoreId.value = store.id;
    editNameValue.value = store.display_name || store.name || '';
    editNameWarning.value = '';
    showEditName.value = true;
};

const saveDisplayName = async () => {
    if (!editNameValue.value.trim()) { toast.error('Display name cannot be empty'); return; }
    try {
        const { data } = await api.patch(`/stores/${editingStoreId.value}/display-name`, {
            display_name: editNameValue.value,
        });
        if (data.warning) editNameWarning.value = data.warning;
        toast.success('Display name updated');
        showEditName.value = false;
        fetchStores();
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to update display name');
    }
};

// ── Update token ───────────────────────────────────────────────
const openUpdateToken = (store: any) => {
    updatingStoreId.value = store.id;
    updateTokenMarketplace.value = getMarketplaceCode(store);
    updateTokenStoreName.value = store.display_name || store.name || '';
    updateTokenStoreId.value = store.external_shop_id || '';
    newToken.value = '';
    tokenError.value = '';
    uzumEmail.value = '';
    uzumPassword.value = '';
    gettingToken.value = false;
    showNewToken.value = false;
    showUpdateToken.value = true;
};

const getUzumTokenForUpdate = async () => {
    gettingToken.value = true;
    tokenError.value = '';
    try {
        const { data } = await api.post('/stores/uzum-token', { email: uzumEmail.value, password: uzumPassword.value });
        newToken.value = data.token;
        toast.success('Token retrieved');
    } catch (e: any) {
        tokenError.value = mapError(e);
    } finally {
        gettingToken.value = false;
    }
};

const saveToken = async () => {
    if (!newToken.value) { tokenError.value = 'Token is required'; return; }
    try {
        await api.patch(`/stores/${updatingStoreId.value}/token`, { token: newToken.value });
        toast.success('Token updated successfully');
        showUpdateToken.value = false;
        fetchStores();
    } catch (e: any) {
        tokenError.value = mapError(e);
    }
};

// ── Disable / Enable ───────────────────────────────────────────
const toggleDisable = async (store: any) => {
    try {
        const action = store.connection_status === 'disabled' ? 'enable' : 'disable';
        await api.patch(`/stores/${store.id}/${action}`);
        toast.success(`Store ${action}d`);
        fetchStores();
    } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to update store status');
    }
};

// ── Delete ─────────────────────────────────────────────────────
const deleteStore = async (id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
        await api.delete(`/stores/${id}`);
        toast.success('Store deleted');
        fetchStores();
    } catch (e) {
        toast.error('Failed to delete store');
    }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString();

function mapError(e: any): string {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message ?? '';
    if (status === 401 || msg.toLowerCase().includes('invalid token')) return 'Invalid token';
    if (status === 403 && msg.toLowerCase().includes('password')) return 'Invalid email or password';
    if (status === 403) return 'Access denied to this store';
    if (status === 404) return 'Store ID not found on marketplace';
    if (status === 409) return 'This store is already connected';
    if (msg) return msg;
    return 'Temporary error, please try again later';
}

onMounted(async () => {
    await fetchSellers();
    await fetchStores();
    await fetchStoreLimit();
});
</script>
