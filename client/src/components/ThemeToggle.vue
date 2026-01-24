<template>
  <button
    @click="cycleTheme"
    class="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted text-muted-foreground hover:text-foreground border border-border bg-card"
    :title="`Current theme: ${theme}`"
  >
    <component :is="activeIcon" class="w-4 h-4" />
    <span class="capitalize">{{ theme }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme, type Theme } from '../composables/useTheme'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

const { theme, setTheme } = useTheme()

const activeIcon = computed(() => {
  switch (theme.value) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    case 'system':
      return Monitor
    default:
      return Monitor
  }
})

function cycleTheme() {
  const modes: Theme[] = ['light', 'dark', 'system']
  const currentIndex = modes.indexOf(theme.value)
  const nextIndex = (currentIndex + 1) % modes.length
  setTheme(modes[nextIndex]!)
}
</script>
