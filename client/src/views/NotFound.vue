<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-center">
          <h1 class="text-6xl font-black text-slate-900 tracking-tight">{{ t('errors.404.title') }}</h1>
          <p class="mt-4 text-lg text-slate-600 font-medium">{{ t('errors.404.message') }}</p>
          <div class="mt-8">
              <Button @click="$router.push('/')">{{ t('errors.404.back_home') }}</Button>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from '../components/ui/Button.vue';

const { t } = useI18n();
</script>
