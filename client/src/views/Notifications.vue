<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground">{{ $t('menu.notifications') }}</h1>
      <p class="text-muted-foreground mt-1">All your notifications and alerts</p>
    </div>

    <!-- Placeholder Content -->
    <div class="bg-card rounded-xl border border-border p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">Notifications Center</h3>
        <p class="text-muted-foreground text-sm">
          This page is under construction. Notifications management functionality will be added soon.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell } from 'lucide-vue-next';
</script>
