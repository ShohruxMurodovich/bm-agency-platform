<template>
  <div class="flex items-center gap-2">
    <component 
      v-for="(tab, index) in tabs" 
      :key="index"
      :is="'button'"
      @click="$emit('update:modelValue', index)"
      :class="[
        'px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
        modelValue === index
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      ]"
    >
      {{ tab }}
    </component>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: string[];
  modelValue: number;
}>();

defineEmits<{
  'update:modelValue': [value: number];
}>();
</script>
