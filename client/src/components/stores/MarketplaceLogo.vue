<template>
  <img
    v-if="logoUrl"
    :src="logoUrl"
    :alt="marketplace"
    :class="sizeClass"
    class="object-contain rounded"
    @error="onError"
  />
  <!-- Fallback: brand-colored text badge -->
  <span v-else
        :class="[sizeClass, 'flex items-center justify-center rounded font-bold text-white text-xs']"
        :style="{ backgroundColor: brandColor }">
    {{ shortName }}
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  marketplace: string; // 'uzum' | 'wb' | 'yandex' | 'ozon' | 'alif'
  size?: 'sm' | 'md' | 'lg';
}>();

const failed = ref(false);
const onError = () => { failed.value = true; };

// Official favicon / CDN logo URLs
const logoUrls: Record<string, string> = {
  uzum:   'https://uzum.uz/favicon.ico',
  wb:     'https://static-basket-01.wbbasket.ru/vol0/site/skin/ru/images/favicons/android-icon-192x192.png',
  yandex: 'https://yastatic.net/market-export/_/i/favicon/favicon-48.png',
  ozon:   'https://www.ozon.ru/favicon.ico',
  alif:   'https://alif.uz/favicon.ico',
};

const brandColors: Record<string, string> = {
  uzum:   '#7000FF',
  wb:     '#CB11AB',
  yandex: '#FC3F1D',
  ozon:   '#005BFF',
  alif:   '#1DA462',
};

const shortNames: Record<string, string> = {
  uzum:   'UZ',
  wb:     'WB',
  yandex: 'YM',
  ozon:   'OZ',
  alif:   'AL',
};

const key = computed(() => props.marketplace?.toLowerCase());
const logoUrl = computed(() => (!failed.value && logoUrls[key.value]) ? logoUrls[key.value] : null);
const brandColor = computed(() => brandColors[key.value] ?? '#6b7280');
const shortName = computed(() => shortNames[key.value] ?? props.marketplace?.slice(0, 2).toUpperCase());

const sizeClass = computed(() => ({
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}[props.size ?? 'md']));
</script>
