<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground">{{ $t('menu.return_acts') }}</h1>
      <p class="text-muted-foreground mt-1">Return documentation and logistics acts</p>
    </div>

    <!-- Placeholder Content -->
    <div class="bg-card rounded-xl border border-border p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">Return Acts</h3>
        <p class="text-muted-foreground text-sm">
          This page is under construction. Return acts management functionality will be added soon.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
</script>
