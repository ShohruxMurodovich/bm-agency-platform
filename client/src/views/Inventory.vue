<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-slate-900">{{ $t('menu.inventory_mgmt') }}</h1>
      <p class="text-slate-600 mt-1">Inventory management system</p>
    </div>

    <!-- Placeholder Content -->
    <div class="bg-white rounded-xl border border-slate-200 p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package class="w-8 h-8 text-indigo-600" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Inventory Page</h3>
        <p class="text-slate-600 text-sm">
          This page is under construction. Inventory management functionality will be added soon.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package } from 'lucide-vue-next';
</script>
