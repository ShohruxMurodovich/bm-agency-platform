<template>
  <div class="space-y-6 animate-fade-in">
       <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('settings.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('settings.subtitle') }}</p>
       </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h4 class="text-base font-semibold text-slate-900 mb-4 flex items-center">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                  {{ t('settings.server_status') }}
              </h4>
              <div v-if="status" class="flex items-center justify-between">
                  <span class="text-slate-500">{{ t('settings.api_gateway') }}</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 capitalize">
                      {{ status.status }}
                  </span>
              </div>
              <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span class="text-slate-500">{{ t('settings.database') }}</span>
                  <span class="text-emerald-600 font-medium">{{ t('status.connected') }}</span>
              </div>
              <div class="mt-2 flex items-center justify-between text-sm">
                  <span class="text-slate-500">{{ t('settings.latency') }}</span>
                  <span class="text-slate-900 font-mono">12ms</span>
              </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-96">
               <h4 class="text-base font-semibold text-slate-900 mb-4">{{ t('settings.system_logs') }}</h4>
               <div class="flex-1 overflow-y-auto space-y-3 pr-2">
                   <div v-for="log in logs" :key="log.id" class="text-sm border-l-2 pl-3 py-1" :class="getLogColor(log.type)">
                       <div class="flex justify-between items-center text-xs text-slate-400 mb-1">
                           <span>{{ new Date(log.created_at).toLocaleTimeString() }}</span>
                           <span class="uppercase font-mono">{{ log.type }}</span>
                       </div>
                       <p class="text-slate-700">{{ log.message }}</p>
                   </div>
                   <div v-if="logs.length === 0" class="text-slate-400 text-sm text-center py-10">
                       {{ t('settings.no_logs') }}
                   </div>
               </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';

const { t } = useI18n();
const status = ref<any>(null);
const logs = ref<any[]>([]);

const getLogColor = (type: string) => {
    switch(type) {
        case 'error': return 'border-rose-500';
        case 'warn': return 'border-amber-500';
        default: return 'border-indigo-500';
    }
}

onMounted(async () => {
    try {
        const statusRes = await api.get('/system/status');
        status.value = statusRes.data;

        const logsRes = await api.get('/system/logs');
        logs.value = logsRes.data;
    } catch (e) {
        console.error(e);
    }
});
</script>
