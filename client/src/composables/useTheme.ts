import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

// Global state to share across components
const theme = ref<Theme>('system')
const effectiveTheme = ref<'light' | 'dark'>('light')

// Helper Query for System Preference (safe for SSR)
const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

const updateEffectiveTheme = () => {
    if (typeof window === 'undefined') return

    if (theme.value === 'system') {
        effectiveTheme.value = mediaQuery?.matches ? 'dark' : 'light'
    } else {
        effectiveTheme.value = theme.value
    }
}

// Initial Sync
if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme
    if (stored) {
        theme.value = stored
    }
    updateEffectiveTheme()
}

// Watch for changes in theme or system preference
watchEffect(() => {
    updateEffectiveTheme()

    if (typeof window !== 'undefined') {
        const root = document.documentElement
        if (effectiveTheme.value === 'dark') {
            root.classList.add('dark')
            root.setAttribute('data-theme', 'dark')
        } else {
            root.classList.remove('dark')
            root.setAttribute('data-theme', 'light')
        }

        localStorage.setItem(STORAGE_KEY, theme.value)
    }
})

// Listen to system changes only if in system mode
const onSystemChange = (e: MediaQueryListEvent) => {
    if (theme.value === 'system') {
        effectiveTheme.value = e.matches ? 'dark' : 'light'
    }
}

mediaQuery?.addEventListener('change', onSystemChange)

export function useTheme() {
    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
    }

    return {
        theme,
        effectiveTheme,
        setTheme
    }
}
