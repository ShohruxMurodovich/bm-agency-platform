<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground">{{ $t('menu.analytics') }}</h1>
      <p class="text-muted-foreground mt-1">{{ $t('analytics.subtitle') }}</p>
    </div>

    <!-- Placeholder Content -->
    <div class="bg-card rounded-xl border border-border p-12">
      <div class="max-w-md mx-auto text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">{{ $t('analytics.title') }}</h3>
        <p class="text-muted-foreground text-sm">
          {{ $t('analytics.placeholder_message') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next';
</script>
