<template>
  <div :class="[sizeClass, 'flex items-center justify-center rounded overflow-hidden flex-shrink-0']">
    <template v-if="key === 'wb'">
      <svg viewBox="0 0 69 70" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
        <rect x="0.132812" y="0.724609" width="68.3165" height="68.3165" rx="17.8924" fill="url(#paint0_linear_105_95)"></rect>
        <path d="M50.7562 24.9912C48.4968 24.9912 46.454 25.6777 44.712 26.8566V16.0957H39.8924V35.9413C39.8924 41.9792 44.7649 46.8381 50.7273 46.8381C56.6897 46.8381 61.6175 42.0083 61.6175 35.8855C61.6175 29.7628 56.798 24.9888 50.7538 24.9888L50.7562 24.9912ZM28.8819 37.3435L24.4715 25.7602H21.0956L16.6587 37.3435L12.2218 25.7602H6.96436L14.7242 46.1273H18.1L22.7559 33.9958L27.4382 46.1273H30.8141L38.5474 25.7602H33.3189L28.8819 37.3435ZM50.7297 41.9816C47.4622 41.9816 44.712 39.3472 44.712 35.9146C44.712 32.4821 47.2986 29.8768 50.7562 29.8768C54.2138 29.8768 56.8004 32.5937 56.8004 35.9146C56.8004 39.2356 54.0502 41.9816 50.7297 41.9816Z" fill="white"></path>
        <defs>
          <linearGradient id="paint0_linear_105_95" x1="26.8807" y1="71.7394" x2="51.4682" y2="-12.7085" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7F30E3"></stop>
            <stop offset="1" stop-color="#F90479"></stop>
          </linearGradient>
        </defs>
      </svg>
    </template>

    <template v-else-if="key === 'yandex'">
      <svg viewBox="0 0 100 100" class="w-full h-full object-cover">
        <circle cx="50" cy="50" r="50" fill="#E32636" />
        <path d="M 22 75 L 38 25 L 50 55 L 62 25 L 78 75" fill="none" stroke="#FFCC00" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
    </template>

    <template v-else-if="key === 'uzum'">
      <svg viewBox="0 0 100 100" class="w-full h-full object-cover">
        <rect width="100" height="100" rx="20" fill="#7000FF" />
        <path d="M 50 18 V 46" stroke="white" stroke-width="14" stroke-linecap="butt" />
        <path d="M 32 30 A 28 28 0 1 0 68 30" fill="none" stroke="white" stroke-width="14" stroke-linecap="butt" />
      </svg>
    </template>

    <template v-else>
      <span class="font-bold text-white text-xs w-full h-full flex items-center justify-center" :style="{ backgroundColor: brandColor }">
        {{ shortName }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  marketplace: string; // 'uzum' | 'wb' | 'yandex' | 'ozon' | 'alif'
  size?: 'sm' | 'md' | 'lg';
}>();

const brandColors: Record<string, string> = {
  uzum: '#7000FF',
  wb: '#CB11AB',
  yandex: '#FC3F1D',
};

const shortNames: Record<string, string> = {
  uzum: 'UZ',
  wb: 'WB',
  yandex: 'YM',
};

const key = computed(() => {
  const mk = props.marketplace?.toLowerCase() || '';
  if (mk.includes('wb') || mk.includes('wildberries')) return 'wb';
  if (mk.includes('uzum')) return 'uzum';
  if (mk.includes('yandex') || mk.includes('ym')) return 'yandex';
  return mk;
});
const brandColor = computed(() => brandColors[key.value] ?? '#6b7280');
const shortName = computed(() => shortNames[key.value] ?? props.marketplace?.slice(0, 2).toUpperCase() ?? '??');

const sizeClass = computed(() => ({
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}[props.size ?? 'md']));
</script>
