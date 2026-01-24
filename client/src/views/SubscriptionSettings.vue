<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('subscription.title') }}</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ t('subscription.subtitle') }}</p>
    </div>

    <!-- Current Plan Card -->
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-500/30 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h2 class="text-xl font-bold text-foreground">{{ planDisplay }}</h2>
            <span v-if="isTrialActive" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30">
              {{ t('subscription.trial_active') }}
            </span>
            <span v-else-if="planName === 'FREE'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {{ t('subscription.forever_free') }}
            </span>
          </div>
          
          <div class="space-y-2 text-sm text-muted-foreground">
            <div v-if="isTrialActive && trialEndsAt" class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{{ t('subscription.trial_ends') }}: <span class="font-medium text-amber-600 dark:text-amber-400">{{ formatDate(trialEndsAt) }}</span> ({{ daysRemaining }} {{ t('subscription.days_left') }})</span>
            </div>
            
            <div class="flex items-center gap-2">
              <Store class="w-4 h-4 text-primary" />
              <span>{{ t('subscription.store_limit') }}: 
                <span :class="storeUsageColor" class="font-medium">{{ storeCount }}/{{ maxStores }}</span>
                {{ t('subscription.stores_connected') }}
              </span>
            </div>
            
            <div v-if="storeCount >= maxStores" class="flex items-center gap-2 text-destructive dark:text-red-400">
              <AlertCircle class="w-4 h-4" />
              <span class="font-medium">{{ t('subscription.store_limit_reached') }}</span>
            </div>
          </div>
        </div>
        
        <Button v-if="planName !== 'VIP'" @click="contactSales" class="ml-4">
          <Zap class="w-4 h-4 mr-2" />
          {{ t('subscription.upgrade_now') }}
        </Button>
      </div>
    </div>

    <!-- Plan Comparison -->
    <div>
      <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('subscription.available_plans') }}</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- FREE Plan -->
        <div :class="planCardClass('FREE')" class="rounded-xl p-6 border-2 transition-all">
          <div class="text-center mb-4">
            <h4 class="text-lg font-bold text-foreground">{{ t('subscription.plan_names.free') }}</h4>
            <div class="mt-2">
              <span class="text-3xl font-bold text-foreground">$0</span>
              <span class="text-muted-foreground text-sm">{{ t('subscription.per_month') }}</span>
            </div>
          </div>
          
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.up_to_stores', { count: 2 }) }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.basic_analytics') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.stock_sync') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <X class="w-4 h-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
              <span class="text-muted-foreground/50">{{ t('subscription.features.priority_support') }}</span>
            </li>
          </ul>
          
          <Button 
            v-if="planName !== 'FREE'" 
            variant="outline" 
            class="w-full mt-4"
            disabled
          >
            {{ t('subscription.current_plan') }}
          </Button>
        </div>

        <!-- STARTER Plan -->
        <div :class="planCardClass('STARTER')" class="rounded-xl p-6 border-2 transition-all">
          <div class="text-center mb-4">
            <h4 class="text-lg font-bold text-foreground">{{ t('subscription.plan_names.starter') }}</h4>
            <div class="mt-2">
              <span class="text-3xl font-bold text-foreground">$49</span>
              <span class="text-muted-foreground text-sm">{{ t('subscription.per_month') }}</span>
            </div>
          </div>
          
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.up_to_stores', { count: 5 }) }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.advanced_analytics') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.realtime_sync') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.email_support') }}</span>
            </li>
          </ul>
          
          <Button 
            v-if="planName === 'STARTER'" 
            variant="outline" 
            class="w-full mt-4"
            disabled
          >
            {{ t('subscription.current_plan') }}
          </Button>
          <Button 
            v-else
            @click="contactSales"
            class="w-full mt-4"
          >
            {{ t('subscription.upgrade') }}
          </Button>
        </div>

        <!-- PREMIUM Plan -->
        <div :class="planCardClass('PREMIUM')" class="rounded-xl p-6 border-2 transition-all relative">
          <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span class="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {{ t('subscription.most_popular') }}
            </span>
          </div>
          
          <div class="text-center mb-4">
            <h4 class="text-lg font-bold text-foreground">{{ t('subscription.plan_names.premium') }}</h4>
            <div class="mt-2">
              <span class="text-3xl font-bold text-foreground">$149</span>
              <span class="text-muted-foreground text-sm">{{ t('subscription.per_month') }}</span>
            </div>
          </div>
          
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.up_to_stores', { count: 20 }) }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.premium_analytics') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.api_access') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.priority_support') }}</span>
            </li>
          </ul>
          
          <Button 
            v-if="planName === 'PREMIUM'" 
            variant="outline" 
            class="w-full mt-4"
            disabled
          >
            {{ t('subscription.current_plan') }}
          </Button>
          <Button 
            v-else
            @click="contactSales"
            class="w-full mt-4 bg-primary hover:bg-primary/90"
          >
            {{ t('subscription.upgrade') }}
          </Button>
        </div>

        <!-- VIP Plan -->
        <div :class="planCardClass('VIP')" class="rounded-xl p-6 border-2 transition-all">
          <div class="text-center mb-4">
            <h4 class="text-lg font-bold text-foreground">{{ t('subscription.plan_names.vip') }}</h4>
            <div class="mt-2">
              <span class="text-3xl font-bold text-foreground">{{ t('subscription.custom') }}</span>
            </div>
          </div>
          
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.unlimited_stores') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.custom_integrations') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.account_manager') }}</span>
            </li>
            <li class="flex items-start gap-2">
              <Check class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{{ t('subscription.features.phone_support') }}</span>
            </li>
          </ul>
          
          <Button 
            v-if="planName === 'VIP'" 
            variant="outline" 
            class="w-full mt-4"
            disabled
          >
            {{ t('subscription.current_plan') }}
          </Button>
          <Button 
            v-else
            @click="contactSales"
            variant="outline"
            class="w-full mt-4"
          >
            {{ t('subscription.contact_sales') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="bg-muted/50 rounded-xl p-6 border border-border">
      <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('subscription.faq.title') }}</h3>
      
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-foreground mb-1">{{ t('subscription.faq.billing_q') }}</h4>
          <p class="text-sm text-muted-foreground">{{ t('subscription.faq.billing_a') }}</p>
        </div>
        
        <div>
          <h4 class="font-medium text-foreground mb-1">{{ t('subscription.faq.trial_q') }}</h4>
          <p class="text-sm text-muted-foreground">{{ t('subscription.faq.trial_a') }}</p>
        </div>
        
        <div>
          <h4 class="font-medium text-foreground mb-1">{{ t('subscription.faq.limit_q') }}</h4>
          <p class="text-sm text-muted-foreground">{{ t('subscription.faq.limit_a') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Button from '../components/ui/Button.vue';
import { Store, Zap, Check, X, Clock, AlertCircle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

const { t } = useI18n();

const planName = ref('FREE');
const trialEndsAt = ref<string | null>(null);
const storeCount = ref(0);
const maxStores = ref(2);

const fetchSubscriptionInfo = async () => {
  try {
    // First, get user data (includes trial_ends_at for public_users)
    const userRes = await api.get('/auth/me');
    const userData = userRes.data;
    
    // Set trial info from user data
    planName.value = userData.subscription_plan || 'FREE';
    trialEndsAt.value = userData.trial_ends_at;
    
    // If user has a seller role or public_user, try to get seller-specific data
    if (userData.role === 'seller' || userData.role === 'public_user') {
      try {
        const sellerRes = await api.get('/sellers/me');
        maxStores.value = sellerRes.data.max_stores || 2;
      } catch (e) {
        // If seller endpoint fails, use default
        maxStores.value = 2;
      }
    }
    
    // Fetch store count
    const storesRes = await api.get('/stores/my-stores');
    storeCount.value = storesRes.data.length;
  } catch (e) {
    console.error('Failed to load subscription info', e);
    toast.error('Failed to load subscription information');
  }
};

const planDisplay = computed(() => {
  const planKey = planName.value.toLowerCase();
  return t(`subscription.plans.${planKey}`) || t('subscription.plans.free');
});

const isTrialActive = computed(() => {
  if (!trialEndsAt.value) return false;
  return new Date(trialEndsAt.value) > new Date();
});

const daysRemaining = computed(() => {
  if (!trialEndsAt.value) return 0;
  const now = new Date();
  const end = new Date(trialEndsAt.value);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

const storeUsageColor = computed(() => {
  if (storeCount.value >= maxStores.value) return 'text-destructive dark:text-red-400';
  if (storeCount.value >= maxStores.value * 0.8) return 'text-amber-600 dark:text-amber-400';
  return 'text-green-600 dark:text-green-400';
});

const planCardClass = (plan: string) => {
  if (plan === planName.value) {
    return 'bg-primary/5 border-primary shadow-lg dark:bg-primary/10 dark:border-primary/50';
  }
  return 'bg-card border-border hover:border-primary/50 hover:shadow-md transition-all';
};

const contactSales = () => {
  window.open(`https://t.me/bmagency_admin?text=${encodeURIComponent(`Hi! I would like to upgrade my account.\n\nCurrent Plan: ${planName.value}\nStore Usage: ${storeCount.value}/${maxStores.value}\n\nPlease contact me to discuss options.`)}`, '_blank');
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

onMounted(() => {
  fetchSubscriptionInfo();
});
</script>
