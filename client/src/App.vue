<template>
  <router-view />
  <Toaster position="top-right" richColors />
</template>

<script setup lang="ts">
import { useTheme } from './composables/useTheme'

// Initialize theme logic
useTheme()
</script>
