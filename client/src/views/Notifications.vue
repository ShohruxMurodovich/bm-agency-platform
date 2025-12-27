<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-slate-900">{{ $t('menu.notifications') }}</h1>
      <p class="text-slate-600 mt-1">All your notifications and alerts</p>
    </div>

    <!-- Placeholder Content -->
    <div class="bg-white rounded-xl border border-slate-200 p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell class="w-8 h-8 text-indigo-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Notifications Center</h3>
        <p class="text-slate-600 text-sm">
          This page is under construction. Notifications management functionality will be added soon.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell } from 'lucide-vue-next';
</script>
