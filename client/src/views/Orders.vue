<template>
  <div class="space-y-6 animate-fade-in">
      <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ t('orders.title') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ t('orders.subtitle') }}</p>
          </div>
          <Button variant="outline" @click="exportOrders">
               <Download class="w-4 h-4 mr-2" />
               {{ t('common.export') }}
          </Button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                      <th class="px-6 py-4 font-medium">{{ t('orders.table.order_number') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('orders.table.product') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('orders.table.qty') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('orders.table.total') }}</th>
                      <th class="px-6 py-4 font-medium">{{ t('orders.table.status') }}</th>
                      <th class="px-6 py-4 font-medium text-right">{{ t('orders.table.actions') }}</th>
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-6 py-4 font-mono text-xs font-medium text-slate-900 border-l-4 border-transparent hover:border-indigo-500 transition-all">
                          {{ order.external_order_id }}
                      </td>
                      <td class="px-6 py-4 text-slate-600">
                          <div v-for="item in order.order_items" :key="item.id" class="text-xs">
                              {{ item.marketplace_product?.title }}
                          </div>
                      </td>
                      <td class="px-6 py-4 text-slate-900">
                          {{ order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) }}
                      </td>
                      <td class="px-6 py-4 font-medium text-slate-900">
                          ${{ order.order_items?.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0).toFixed(2) }}
                      </td>
                      <td class="px-6 py-4">
                          <span :class="getStatusColor(order.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                              {{ t('status.' + order.status) }}
                          </span>
                      </td>
                      <td class="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" @click="viewOrder(order)">{{ t('common.view') }}</Button>
                      </td>
                  </tr>
                   <tr v-if="orders.length === 0">
                      <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                          {{ t('orders.no_orders') }}
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>

      <Dialog 
        :isOpen="!!selectedOrder" 
        :title="`${t('orders.table.order_number')} ${selectedOrder?.external_order_id}`" 
        :description="t('orders.subtitle')"
        @close="selectedOrder = null"
        @confirm="selectedOrder = null"
      >
        <div v-if="selectedOrder" class="space-y-4">
           <div>
              <p class="text-xs text-slate-500 uppercase font-bold mb-2">{{ t('orders.items') }}</p>
              <div v-for="item in selectedOrder.order_items" :key="item.id" class="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div class="font-medium text-slate-800">{{ item.marketplace_product?.title || 'Unknown Product' }}</div>
                    <div class="text-slate-500 text-xs mt-0.5">{{ t('orders.table.qty') }}: {{ item.quantity }}</div>
                  </div>
                  <div class="font-medium text-slate-800">
                    ${{ (Number(item.price) * item.quantity).toFixed(2) }}
                  </div>
              </div>
           </div>
           
           <div class="pt-2 flex justify-between items-center border-t border-slate-100">
                <span class="font-bold text-slate-700">{{ t('orders.table.total') }}</span>
                <span class="font-bold text-indigo-600 text-lg">
                    ${{ selectedOrder.order_items?.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0).toFixed(2) }}
                </span>
           </div>
        </div>
      </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import Button from '../components/ui/Button.vue';
import Dialog from '../components/ui/Dialog.vue';
import { Download } from 'lucide-vue-next';

const { t } = useI18n();
const orders = ref<any[]>([]);
const selectedOrder = ref<any>(null);

const getStatusColor = (status: string) => {
    switch(status) {
        case 'pending': return 'bg-amber-50 text-amber-700';
        case 'processing': return 'bg-blue-50 text-blue-700';
        case 'shipped': return 'bg-indigo-50 text-indigo-700';
        case 'completed': return 'bg-emerald-50 text-emerald-700';
        case 'cancelled': return 'bg-rose-50 text-rose-700';
        default: return 'bg-slate-100 text-slate-700';
    }
}

const viewOrder = (order: any) => {
    selectedOrder.value = order;
};

const exportOrders = () => {
    const headers = ['Order #', 'Products', 'Qty', 'Total', 'Status'];
    const rows = orders.value.map(o => {
        const productsStr = o.order_items?.map((i: any) => `${i.marketplace_product?.title} (x${i.quantity})`).join('; ') || '';
        const totalQty = o.order_items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0;
        const totalPrice = o.order_items?.reduce((acc: number, i: any) => acc + (Number(i.price) * i.quantity), 0) || 0;
        
        return [
            o.external_order_id, 
            productsStr.replace(/"/g, '""'), // Escape quotes for CSV
            totalQty, 
            totalPrice.toFixed(2), 
            o.status
        ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n"); // Quote all cells
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

onMounted(async () => {
    try {
        const { data } = await api.get('/orders');
        orders.value = data;
    } catch (e) {
        console.error(e);
    }
});
</script>
