<template>
  <!-- Fullscreen modal backdrop -->
  <Teleport to="body">
    <div v-if="isOpen"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
         @click.self="closeIfSafe">

      <div class="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 class="text-lg font-bold text-foreground">Connect Store</h2>
            <p class="text-xs text-muted-foreground mt-0.5">Step {{ step }} of 4</p>
          </div>
          <!-- Progress dots -->
          <div class="flex items-center gap-1.5">
            <span v-for="s in 4" :key="s"
                  class="w-2 h-2 rounded-full transition-all duration-300"
                  :class="s <= step ? 'bg-primary' : 'bg-muted'"></span>
          </div>
          <button @click="handleClose" class="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X class="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <!-- ═══════════════════════════════════════════
               STEP 1 — Marketplace & Owner
          ═══════════════════════════════════════════ -->
          <div v-if="step === 1" class="space-y-5">
            <div>
              <p class="text-sm font-medium text-foreground mb-3">Choose marketplace *</p>
              <div class="grid grid-cols-3 gap-3">
                <button v-for="mp in marketplaces" :key="mp.value"
                        @click="selectMarketplace(mp.value)"
                        :class="['flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                 state.marketplace === mp.value
                                   ? 'border-primary bg-primary/5'
                                   : 'border-border hover:border-border/80 hover:bg-muted/30']">
                  <MarketplaceLogo :marketplace="mp.value" size="lg" />
                  <span class="text-xs font-medium text-foreground text-center leading-tight">{{ mp.label }}</span>
                </button>
              </div>
            </div>

            <!-- Owner selector (Admin/Staff only) -->
            <div v-if="authStore.isAdmin || authStore.isStaff">
              <label class="block text-sm font-medium text-foreground mb-1">Store Owner *</label>
              <select v-model="state.ownerId"
                      class="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select seller or public user...</option>
                <option v-for="seller in sellers" :key="seller.id" :value="seller.id">
                  {{ seller.name }} {{ seller.user?.email ? `(${seller.user.email})` : '' }}
                </option>
              </select>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════
               STEP 2 — Store Identification
          ═══════════════════════════════════════════ -->
          <div v-if="step === 2" class="space-y-4">
            <div class="p-3 rounded-lg bg-muted/40 border border-border/50 flex items-center gap-2">
              <MarketplaceLogo :marketplace="state.marketplace" size="sm" />
              <span class="text-sm font-medium text-foreground">{{ currentMarketplace?.label }}</span>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Store ID (external) *</label>
              <input v-model="state.storeId"
                     type="text"
                     placeholder="e.g. 123456"
                     @blur="state.storeId = state.storeId.trim()"
                     :class="['w-full h-10 rounded-lg border px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                              fieldErrors.storeId ? 'border-destructive' : 'border-input']" />
              <p v-if="fieldErrors.storeId" class="text-xs text-destructive mt-1">{{ fieldErrors.storeId }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">Display name *</label>
              <input v-model="state.displayName"
                     type="text"
                     placeholder='e.g. "Store A Uzum"'
                     :class="['w-full h-10 rounded-lg border px-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                              fieldErrors.displayName ? 'border-destructive' : 'border-input']" />
              <p v-if="fieldErrors.displayName" class="text-xs text-destructive mt-1">{{ fieldErrors.displayName }}</p>
              <p v-else class="text-xs text-muted-foreground mt-1">Use a unique name to distinguish stores. e.g. "Store A Uzum", "Main WB Store"</p>
              <!-- Duplicate warning -->
              <p v-if="state.duplicateWarning" class="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <span>⚠</span> {{ state.duplicateWarning }}
              </p>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════
               STEP 3 — Credentials
          ═══════════════════════════════════════════ -->
          <div v-if="step === 3" class="space-y-4">
            <div class="p-3 rounded-lg bg-muted/40 border border-border/50 text-sm text-muted-foreground">
              <span class="font-medium text-foreground">{{ currentMarketplace?.label }}</span>
              · Store ID: <span class="font-mono">{{ state.storeId }}</span>
              · <span class="text-foreground font-medium">{{ state.displayName }}</span>
            </div>

            <!-- Global error banner -->
            <div v-if="state.error"
                 class="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              {{ state.error }}
            </div>

            <!-- Uzum: email + password → Get Token → token (readonly) -->
            <template v-if="state.marketplace === 'uzum'">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Uzum Email *</label>
                <input v-model="state.email" type="email" placeholder="seller@example.com"
                       class="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">Uzum Password *</label>
                <div class="relative">
                  <input v-model="state.password"
                         :type="showPassword ? 'text' : 'password'"
                         placeholder="Password (not stored)"
                         class="w-full h-10 rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button @click="showPassword = !showPassword" type="button"
                          class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    <Eye v-if="!showPassword" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">Email and password are never stored.</p>
              </div>
              <button @click="getUzumToken"
                      :disabled="state.gettingToken || !state.email || !state.password"
                      class="w-full h-9 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium text-foreground flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Loader2 v-if="state.gettingToken" class="w-3.5 h-3.5 animate-spin" />
                <Zap v-else class="w-3.5 h-3.5 text-primary" />
                {{ state.gettingToken ? 'Getting token...' : 'Get Token' }}
              </button>
              <!-- Token (read-only after Get Token) -->
              <div v-if="state.token">
                <label class="block text-sm font-medium text-foreground mb-1">Token (auto-filled)</label>
                <div class="relative">
                  <input :value="showToken ? state.token : '•'.repeat(Math.min(state.token.length, 32))"
                         readonly
                         class="w-full h-10 rounded-lg border border-input bg-muted/30 px-3 pr-10 text-sm font-mono text-foreground cursor-not-allowed" />
                  <button @click="showToken = !showToken" type="button"
                          class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    <Eye v-if="!showToken" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </template>

            <!-- WB / Yandex: manual token -->
            <template v-else>
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">API Token *</label>
                <div class="relative">
                  <input v-model="state.token"
                         :type="showToken ? 'text' : 'password'"
                         placeholder="Paste your API token"
                         :class="['w-full h-10 rounded-lg border px-3 pr-10 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                                  fieldErrors.token ? 'border-destructive' : 'border-input']" />
                  <button @click="showToken = !showToken" type="button"
                          class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    <Eye v-if="!showToken" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="fieldErrors.token" class="text-xs text-destructive mt-1">{{ fieldErrors.token }}</p>
                <p v-else class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ t('stores.token_description') }}</p>
              </div>
            </template>

            <!-- Validate button -->
            <button @click="validateCredentials"
                    :disabled="state.validating || !canValidate"
                    class="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors">
              <Loader2 v-if="state.validating" class="w-4 h-4 animate-spin" />
              <ShieldCheck v-else class="w-4 h-4" />
              {{ state.validating ? 'Validating...' : 'Validate' }}
            </button>

            <!-- Validation success indicator -->
            <div v-if="state.validateSuccess"
                 class="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle class="w-4 h-4 shrink-0" />
              Validation successful — "<span class="font-medium">{{ state.marketplaceStoreName }}</span>"
            </div>
          </div>

          <!-- ═══════════════════════════════════════════
               STEP 4 — Confirmation
          ═══════════════════════════════════════════ -->
          <div v-if="step === 4" class="space-y-4">
            <div class="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <h3 class="text-sm font-semibold text-foreground border-b border-border pb-2">Confirm Store Connection</h3>
              <div class="grid grid-cols-2 gap-y-2 text-sm">
                <span class="text-muted-foreground">Marketplace</span>
                <span class="font-medium text-foreground">{{ currentMarketplace?.label }}</span>

                <span class="text-muted-foreground">Store ID</span>
                <span class="font-mono text-foreground">{{ state.storeId }}</span>

                <span class="text-muted-foreground">Display name</span>
                <span class="font-medium text-foreground">{{ state.displayName }}</span>

                <span class="text-muted-foreground">Marketplace name</span>
                <span class="font-medium text-foreground">{{ state.marketplaceStoreName }}</span>

                <template v-if="state.ownerId && (authStore.isAdmin || authStore.isStaff)">
                  <span class="text-muted-foreground">Owner</span>
                  <span class="text-foreground">{{ ownerName }}</span>
                </template>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-400">
              Token will be encrypted and stored securely. Email and password (Uzum) are never saved.
            </div>
          </div>

        </div>

        <!-- Footer actions -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 shrink-0 gap-3">
          <button v-if="step > 1" @click="prevStep"
                  class="px-4 h-9 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
            ← Back
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <button @click="handleClose"
                    class="px-4 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>

            <!-- Steps 1-3: Next -->
            <button v-if="step < 4" @click="nextStep"
                    :disabled="!canProceed"
                    class="px-5 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
            <!-- Step 4: Confirm & Connect -->
            <button v-else @click="confirmConnect"
                    :disabled="state.connecting"
                    class="px-5 h-9 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              <Loader2 v-if="state.connecting" class="w-3.5 h-3.5 animate-spin" />
              <CheckCircle v-else class="w-3.5 h-3.5" />
              {{ state.connecting ? 'Connecting...' : 'Confirm & Connect' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { X, Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import api from '../../api';
import { useAuthStore } from '../../stores/auth';
import MarketplaceLogo from './MarketplaceLogo.vue';
import { useI18n } from 'vue-i18n';

// ── Props & emits ──────────────────────────────────────────────
const props = defineProps<{ isOpen: boolean; sellers: any[] }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'connected'): void }>();
const authStore = useAuthStore();
const { t } = useI18n();

// ── Marketplace definitions ────────────────────────────────────
const marketplaces = [
    { value: 'uzum',   label: 'Uzum Market'   },
    { value: 'wb',     label: 'Wildberries'   },
    { value: 'yandex', label: 'Yandex Market' },
];

// ── Wizard state ───────────────────────────────────────────────
const step = ref(1);
const showPassword = ref(false);
const showToken = ref(false);

const state = reactive({
    marketplace: '',
    ownerId: '',
    storeId: '',
    displayName: '',
    token: '',
    email: '',
    password: '',
    gettingToken: false,
    validating: false,
    validateSuccess: false,
    marketplaceStoreName: '',
    error: '',
    duplicateWarning: '',
    connecting: false,
});

const fieldErrors = reactive({
    storeId: '',
    displayName: '',
    token: '',
});

// ── Computed ───────────────────────────────────────────────────
const currentMarketplace = computed(() =>
    marketplaces.find(m => m.value === state.marketplace));

const ownerName = computed(() =>
    props.sellers.find(s => s.id === state.ownerId)?.name ?? '');

const canProceed = computed(() => {
    if (step.value === 1) {
        if (!state.marketplace) return false;
        if ((authStore.isAdmin || authStore.isStaff) && !state.ownerId) return false;
        return true;
    }
    if (step.value === 2) {
        return !!state.storeId.trim() && !!state.displayName.trim();
    }
    if (step.value === 3) {
        return state.validateSuccess;
    }
    return true;
});

const canValidate = computed(() => {
    if (state.marketplace === 'uzum') return !!state.token;
    return !!state.token;
});

// ── Marketplace select (resets credentials) ────────────────────
function selectMarketplace(value: string) {
    if (state.marketplace !== value) {
        state.token = '';
        state.email = '';
        state.password = '';
        state.validateSuccess = false;
        state.marketplaceStoreName = '';
        state.error = '';
    }
    state.marketplace = value;
}

// ── Navigation ─────────────────────────────────────────────────
function prevStep() {
    if (step.value > 1) step.value--;
}

function nextStep() {
    clearErrors();
    if (step.value === 2) {
        if (!state.storeId.trim()) { fieldErrors.storeId = 'Store ID is required'; return; }
        if (!state.displayName.trim()) { fieldErrors.displayName = 'Display name is required'; return; }
    }
    if (step.value < 4) step.value++;
}

function clearErrors() {
    fieldErrors.storeId = '';
    fieldErrors.displayName = '';
    fieldErrors.token = '';
    state.error = '';
}

// ── Get Uzum Token ─────────────────────────────────────────────
async function getUzumToken() {
    state.gettingToken = true;
    state.error = '';
    state.validateSuccess = false;
    try {
        const { data } = await api.post('/stores/uzum-token', {
            email: state.email,
            password: state.password,
        });
        state.token = data.token;
        toast.success('Token retrieved successfully');
    } catch (e: any) {
        state.error = mapError(e);
    } finally {
        state.gettingToken = false;
    }
}

// ── Validate ───────────────────────────────────────────────────
async function validateCredentials() {
    if (!state.token) { fieldErrors.token = 'Token is required'; return; }
    state.validating = true;
    state.validateSuccess = false;
    state.error = '';
    try {
        const { data } = await api.post('/stores/validate', {
            marketplace: state.marketplace,
            external_shop_id: state.storeId,
            token: state.token,
        });
        if (data.success) {
            state.validateSuccess = true;
            state.marketplaceStoreName = data.marketplace_store_name ?? '';
        } else {
            state.error = 'Validation failed. Check your credentials and store ID.';
        }
    } catch (e: any) {
        state.error = mapError(e);
    } finally {
        state.validating = false;
    }
}

// ── Confirm & Connect ──────────────────────────────────────────
async function confirmConnect() {
    state.connecting = true;
    state.error = '';
    try {
        await api.post('/stores', {
            marketplace: state.marketplace,
            external_shop_id: state.storeId.trim(),
            display_name: state.displayName.trim(),
            token: state.token,
            owner_id: state.ownerId || undefined,
        });
        toast.success('Store connected successfully!');
        emit('connected');
        handleClose();
    } catch (e: any) {
        if (e.response?.status === 403 && e.response?.data?.message?.includes('limit')) {
            toast.error(e.response.data.message);
        } else {
            state.error = mapError(e);
        }
    } finally {
        state.connecting = false;
    }
}

// ── Error mapping ──────────────────────────────────────────────
function mapError(e: any): string {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message ?? '';
    if (status === 401 || msg.toLowerCase().includes('invalid token')) return 'Invalid token';
    if (status === 403 && msg.toLowerCase().includes('password')) return 'Invalid email or password';
    if (status === 403) return 'Access denied to this store';
    if (status === 404) return 'Store ID not found on marketplace';
    if (status === 409) return 'This store is already connected to another account';
    if (status === 429) return 'Too many requests. Please wait a minute and try again.';
    if (msg) return msg;
    return 'Temporary error, please try again later';
}

// ── Close ──────────────────────────────────────────────────────
function closeIfSafe() {
    if (!state.connecting && !state.validating && !state.gettingToken) {
        handleClose();
    }
}

function handleClose() {
    emit('close');
    // Reset after animation
    setTimeout(resetState, 300);
}

function resetState() {
    step.value = 1;
    showPassword.value = false;
    showToken.value = false;
    Object.assign(state, {
        marketplace: '', ownerId: '', storeId: '', displayName: '',
        token: '', email: '', password: '',
        gettingToken: false, validating: false,
        validateSuccess: false, marketplaceStoreName: '',
        error: '', duplicateWarning: '', connecting: false,
    });
    Object.assign(fieldErrors, { storeId: '', displayName: '', token: '' });
}

// Reset validate state when token changes
watch(() => state.token, () => {
    if (state.validateSuccess) {
        state.validateSuccess = false;
        state.marketplaceStoreName = '';
    }
});
</script>
