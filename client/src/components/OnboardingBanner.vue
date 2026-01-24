<template>
  <div 
    v-if="shouldShowBanner" 
    class="mb-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border-2 border-indigo-200 shadow-lg animate-fade-in"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
            <Sparkles class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-slate-900">{{ $t('onboarding.welcome_title') }}</h3>
            <p class="text-sm text-slate-600 mt-0.5">{{ $t('onboarding.welcome_subtitle') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <!-- Step 1: Connect Store -->
          <router-link 
            to="/stores" 
            class="bg-white/80 hover:bg-white rounded-lg p-4 border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                <Store class="w-4 h-4 text-indigo-600 group-hover:text-white" />
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-slate-900 mb-1">{{ $t('onboarding.step1_title') }}</h4>
                <p class="text-xs text-slate-600">{{ $t('onboarding.step1_desc') }}</p>
              </div>
            </div>
          </router-link>

          <!-- Step 2: Create Product -->
          <router-link 
            to="/parent-products" 
            class="bg-white/80 hover:bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition-colors">
                <Package class="w-4 h-4 text-purple-600 group-hover:text-white" />
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-slate-900 mb-1">{{ $t('onboarding.step2_title') }}</h4>
                <p class="text-xs text-slate-600">{{ $t('onboarding.step2_desc') }}</p>
              </div>
            </div>
          </router-link>

          <!-- Step 3: Map Products -->
          <router-link 
            to="/parent-products" 
            class="bg-white/80 hover:bg-white rounded-lg p-4 border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all group"
          >
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-600 transition-colors">
                <Link2 class="w-4 h-4 text-pink-600 group-hover:text-white" />
              </div>
              <div class="flex-1">
                <h4 class="font-semibold text-slate-900 mb-1">{{ $t('onboarding.step3_title') }}</h4>
                <p class="text-xs text-slate-600">{{ $t('onboarding.step3_desc') }}</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <button 
        @click="dismissBanner" 
        class="ml-4 p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
        :title="$t('onboarding.dismiss')"
      >
        <X class="w-5 h-5 text-slate-400 hover:text-slate-600" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { Sparkles, Store, Package, Link2, X } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const sellerData = ref<any>(null);
const storesCount = ref(0);
const productsCount = ref(0);

const shouldShowBanner = computed(() => {
  // Only show for PUBLIC_USER
  if (authStore.user?.role !== 'public_user') {
    return false;
  }

  // Don't show if onboarding is completed
  if (sellerData.value?.onboarding_completed) {
    return false;
  }

  // Show if user has no stores OR no products
  return storesCount.value === 0 || productsCount.value === 0;
});

const fetchOnboardingStatus = async () => {
  try {
    // Fetch seller info
    const { data: seller } = await api.get('/sellers/me');
    sellerData.value = seller;

    // Fetch stores count
    const { data: stores } = await api.get('/stores/my-stores');
    storesCount.value = stores.length;

    // Fetch products count
    const { data: products } = await api.get('/parent-products');
    productsCount.value = products.length;
  } catch (e) {
    console.error('Failed to fetch onboarding status', e);
  }
};

const dismissBanner = async () => {
  try {
    await api.patch('/sellers/me/complete-onboarding');
    if (sellerData.value) {
      sellerData.value.onboarding_completed = true;
    }
  } catch (e) {
    console.error('Failed to dismiss onboarding', e);
  }
};

onMounted(() => {
  fetchOnboardingStatus();
});
</script>
