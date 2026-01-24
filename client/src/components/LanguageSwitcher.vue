<template>
  <div class="relative">
    <Menu as="div" class="relative inline-block text-left">
      <div>
        <MenuButton
          class="inline-flex w-full justify-center rounded-md border border-input px-3 py-2 text-sm font-medium text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
            <span class="mr-2">{{ currentLang?.flag }}</span>
            <span class="uppercase">{{ currentLang?.code }}</span>
            <ChevronDown class="-mr-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </MenuButton>
      </div>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems
          class="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border"
        >
          <div class="py-1">
            <MenuItem v-for="lang in languages" :key="lang.code" v-slot="{ active }">
              <button
                @click="switchLanguage(lang.code)"
                :class="[
                  active ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  'group flex w-full items-center px-4 py-2 text-sm',
                  currentLocale === lang.code ? 'bg-muted/50 font-semibold text-foreground' : ''
                ]"
              >
                  <span class="mr-3">{{ lang.flag }}</span>
                  {{ lang.name }}
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { ChevronDown } from 'lucide-vue-next';

const { locale } = useI18n();

const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uz', name: 'O‘zbek', flag: '🇺🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
];

const currentLocale = computed(() => locale.value);

const currentLang = computed(() => {
    return languages.find(l => l.code === locale.value) || languages[0];
});

const switchLanguage = (code: string) => {
    locale.value = code;
    localStorage.setItem('lang', code);
};
</script>
