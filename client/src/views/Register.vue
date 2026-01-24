<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
           <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
               P
           </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
        {{ t('register.title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-muted-foreground">
          {{ t('register.subtitle') }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-card py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-xl sm:px-10 border border-border">
        <form class="space-y-6" @submit.prevent="handleRegister">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-foreground">{{ t('register.email') }}</label>
            <div class="mt-1">
              <Input 
                id="email" 
                v-model="form.email" 
                type="email" 
                autocomplete="email" 
                required 
                :placeholder="t('register.email_placeholder')" 
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-foreground">{{ t('register.password') }}</label>
            <div class="mt-1">
              <Input 
                id="password" 
                v-model="form.password" 
                type="password" 
                autocomplete="new-password" 
                required 
                minlength="6"
                :placeholder="t('register.password_placeholder')" 
              />
            </div>
          </div>

          <!-- Business Name (Optional) -->
          <div>
            <label for="business_name" class="block text-sm font-medium text-foreground">
              {{ t('register.business_name') }} <span class="text-muted-foreground font-normal text-xs">{{ t('register.business_name_optional') }}</span>
            </label>
            <div class="mt-1">
              <Input 
                id="business_name" 
                v-model="form.business_name" 
                type="text" 
                autocomplete="organization"
                :placeholder="t('register.business_name_placeholder')" 
              />
            </div>
          </div>

          <!-- Phone (Optional) -->
          <div>
            <label for="phone" class="block text-sm font-medium text-foreground">
              {{ t('register.phone') }} <span class="text-muted-foreground font-normal text-xs">{{ t('register.phone_optional') }}</span>
            </label>
            <div class="mt-1">
              <Input 
                id="phone" 
                v-model="form.phone" 
                type="tel" 
                autocomplete="tel"
                :placeholder="t('register.phone_placeholder')" 
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="rounded-md bg-destructive/10 p-4 border border-destructive/20">
              <div class="flex">
                  <div class="flex-shrink-0">
                      <XCircle class="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div class="ml-3">
                      <h3 class="text-sm font-medium text-destructive">{{ error }}</h3>
                  </div>
              </div>
          </div>

          <!-- Trial Info Banner -->
          <div class="rounded-lg bg-primary/5 p-4 border border-primary/10">
            <div class="flex items-start gap-3">
              <Sparkles class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div class="text-sm">
                <p class="font-semibold text-foreground mb-1">{{ t('register.trial_info.title') }}</p>
                <ul class="space-y-1 text-muted-foreground">
                  <li>✓ {{ t('register.trial_info.item1') }}</li>
                  <li>✓ {{ t('register.trial_info.item2') }}</li>
                  <li>✓ {{ t('register.trial_info.item3') }}</li>
                  <li>✓ {{ t('register.trial_info.item4') }}</li>
                  <li>✓ {{ t('register.trial_info.item5') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
             <Button type="submit" class="w-full justify-center" :disabled="loading">
                 <Loader2 v-if="loading" class="w-4 h-4 animate-spin mr-2" />
                 {{ loading ? t('register.submitting') : t('register.submit') }}
             </Button>
          </div>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-muted-foreground">
            {{ t('register.have_account') }}
            <router-link to="/login" class="text-primary hover:text-primary/80 font-semibold transition-colors">
              {{ t('register.sign_in') }}
            </router-link>
          </p>
        </div>

        <!-- Terms -->
        <p class="mt-4 text-center text-xs text-muted-foreground">
          {{ t('register.terms') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import { Loader2, Sparkles, XCircle } from 'lucide-vue-next';
import api from '../api';
import { toast } from 'vue-sonner';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const form = ref({
  email: '',
  password: '',
  business_name: '',
  phone: '',
});

const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  error.value = '';
  loading.value = true;

  try {
    // Prepare payload
    const payload: any = {
      email: form.value.email,
      password: form.value.password,
    };

    // Only add optional fields if they have values
    if (form.value.business_name && form.value.business_name.trim()) {
      payload.business_name = form.value.business_name.trim();
    }
    if (form.value.phone && form.value.phone.trim()) {
      payload.phone = form.value.phone.trim();
    }

    console.log('Registration payload:', payload);

    // Call registration endpoint
    const { data } = await api.post('/auth/register', payload);

    console.log('Registration successful:', data);

    // Store token in localStorage AND authStore
    localStorage.setItem('token', data.access_token);
    authStore.token = data.access_token;
    
    // Fetch user data
    await authStore.fetchUser();

    console.log('User fetched:', authStore.user);

    toast.success(t('register.success'));

    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    // Redirect to dashboard
    router.push('/');
  } catch (e: any) {
    console.error('Registration error:', e);
    console.error('Error response:', e.response?.data);
    
    // Extract error message
    const errorMsg = e.response?.data?.message || e.message || 'Registration failed. Please try again.';
    error.value = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};
</script>
