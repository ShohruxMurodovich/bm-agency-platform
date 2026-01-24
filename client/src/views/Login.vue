<template>
  <div class="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
           <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20">
               P
           </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
        {{ t('login.title') }}
      </h2>
      <p class="mt-2 text-center text-sm text-muted-foreground">
          {{ t('login.subtitle') }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-card py-8 px-4 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-xl sm:px-10 border border-border">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-foreground">{{ t('login.email') }}</label>
            <div class="mt-1">
              <Input id="email" v-model="email" type="email" autocomplete="email" required placeholder="name@company.com" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-foreground">{{ t('login.password') }}</label>
            <div class="mt-1">
              <Input id="password" v-model="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background" />
              <label for="remember-me" class="ml-2 block text-sm text-muted-foreground">{{ t('login.remember_me') }}</label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-primary hover:text-primary/80 transition-colors">{{ t('login.forgot_password') }}</a>
            </div>
          </div>

          <div v-if="errorMessage" class="rounded-md bg-destructive/10 p-4 mb-4 border border-destructive/20">
              <div class="flex">
                  <div class="flex-shrink-0">
                      <XCircle class="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div class="ml-3">
                      <h3 class="text-sm font-medium text-destructive">{{ errorMessage }}</h3>
                  </div>
              </div>
          </div>

          <div>
             <Button type="submit" class="w-full justify-center" :disabled="loading">
                 <Loader2 v-if="loading" class="w-4 h-4 animate-spin mr-2" />
                 {{ t('login.submit') }}
             </Button>
          </div>
        </form>

        <!-- Register Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-muted-foreground">
            {{ t('login.no_account') }}
            <router-link to="/register" class="text-indigo-600 hover:text-indigo-700 font-semibold">
              {{ t('login.start_trial') }}
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';
import { Loader2, XCircle } from 'lucide-vue-next';

const { t } = useI18n();
const email = ref('admin@platform.com'); // Pre-fill for convenience
const password = ref('admin123');
const loading = ref(false);
const errorMessage = ref('');
const authStore = useAuthStore();

const handleLogin = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        await authStore.login({ email: email.value, password: password.value });
    } catch (e: any) {
        console.error(e);
        if (e.response && e.response.status === 401) {
             errorMessage.value = t('login.error.invalid');
        } else {
             errorMessage.value = t('login.error.generic');
        }
    } finally {
        loading.value = false;
    }
};
</script>
