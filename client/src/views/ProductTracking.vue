<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('productTracking.title') }}</h1>
      <p class="text-sm text-muted-foreground mt-1">{{ t('productTracking.subtitle') }}</p>
    </div>

    <!-- Tabs -->
    <div class="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div class="border-b border-border">
        <div class="flex">
          <button
            @click="activeTab = 'marketplace'"
            :class="[
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'marketplace'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            ]"
          >
            {{ t('productTracking.tabs.marketplace') }}
          </button>
          <button
            @click="activeTab = 'warehouse'"
            :class="[
              'px-6 py-3 text-sm font-medium transition-colors',
              activeTab === 'warehouse'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            ]"
          >
            {{ t('productTracking.tabs.warehouse') }}
          </button>
        </div>
      </div>

      <!-- TAB 1: Marketplace Movements (WITH order_number) -->
      <div v-if="activeTab === 'marketplace'" class="p-6 space-y-4">
        <!-- Filters for TAB 1 -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.search') }}</label>
            <div class="relative">
              <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                v-model="marketplaceFilters.search"
                @input="debouncedFetchOrders"
                :placeholder="t('productTracking.searchPlaceholder')"
                class="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_from') }}</label>
            <input
              type="date"
              v-model="marketplaceFilters.dateFrom"
              @change="fetchOrders"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_to') }}</label>
            <input
              type="date"
              v-model="marketplaceFilters.dateTo"
              @change="fetchOrders"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.movement_type') }}</label>
            <select
              v-model="marketplaceFilters.movementType"
              @change="fetchOrders"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="type in movementTypes" :key="type" :value="type">{{ t(`movementTypes.${type}`) }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.location') }}</label>
            <select
              v-model="marketplaceFilters.locationId"
              @change="fetchOrders"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
            </select>
          </div>
        </div>

        <!-- Orders List (Level 1) -->
        <div v-if="loadingOrders" class="p-12 flex justify-center text-muted-foreground">
          <Loader2 class="w-6 h-6 animate-spin mr-2" />
          {{ t('common.loading') }}
        </div>
        <div v-else-if="orders.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
          <Package class="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p>{{ t('productTracking.noOrders') }}</p>
        </div>
        <div v-else class="border border-border rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 border-b border-border">
              <tr>
                <th class="text-left p-3 font-medium text-muted-foreground w-10"></th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.orderNumber') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.lastMovement') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.currentLocation') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.currentStatus') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.itemsCount') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.movementsCount') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="order in orders" :key="order.effective_order_number">
                <!-- Level 1: Order Row -->
                <tr
                  @click="toggleOrderExpansion(order.effective_order_number)"
                  class="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <td class="p-3">
                    <ChevronRight :class="['w-4 h-4 transition-transform', expandedOrders.has(order.effective_order_number) ? 'rotate-90' : '']" />
                  </td>
                  <td class="p-3 font-medium text-foreground">{{ order.effective_order_number }}</td>
                  <td class="p-3 text-muted-foreground">{{ formatDate(order.last_movement_at) }}</td>
                  <td class="p-3">
                    <span :class="order.is_mixed_location ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'">
                      {{ order.current_location }}
                    </span>
                  </td>
                  <td class="p-3">
                    <span :class="order.is_mixed_status ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'">
                      {{ order.current_status }}
                    </span>
                  </td>
                  <td class="p-3 text-muted-foreground">{{ order.items_count }}</td>
                  <td class="p-3 text-muted-foreground">{{ order.movements_count }}</td>
                </tr>

                <!-- Level 2: Products in Order -->
                <tr v-if="expandedOrders.has(order.effective_order_number)" class="bg-muted/20">
                  <td colspan="7" class="p-0">
                    <div class="p-4 pl-10">
                      <div v-if="loadingProducts[order.effective_order_number]" class="py-8 flex justify-center text-muted-foreground">
                        <Loader2 class="w-5 h-5 animate-spin mr-2" />
                        {{ t('common.loading') }}
                      </div>
                      <table v-else class="w-full text-sm border border-border rounded-md overflow-hidden">
                        <thead class="bg-muted/50">
                          <tr>
                            <th class="text-left p-2 font-medium text-muted-foreground w-8"></th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.productName') }}</th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.sku') }}</th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.currentLocation') }}</th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.currentStatus') }}</th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.lastMovement') }}</th>
                            <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.movementsCount') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-for="product in orderProducts[order.effective_order_number]" :key="product.parent_product_id">
                            <!-- Level 2: Product Row -->
                            <tr
                              @click="toggleProductExpansion(order.effective_order_number, product.parent_product_id)"
                              class="border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                            >
                              <td class="p-2">
                                <ChevronRight :class="['w-3 h-3 transition-transform', expandedProducts.has(`${order.effective_order_number}_${product.parent_product_id}`) ? 'rotate-90' : '']" />
                              </td>
                              <td class="p-2 text-foreground">{{ product.product_name }}</td>
                              <td class="p-2 text-muted-foreground">{{ product.sku }}</td>
                              <td class="p-2 text-muted-foreground">{{ product.current_location }}</td>
                              <td class="p-2 text-muted-foreground">{{ product.current_status }}</td>
                              <td class="p-2 text-muted-foreground">{{ formatDate(product.last_movement_at) }}</td>
                              <td class="p-2 text-muted-foreground">{{ product.movements_count }}</td>
                            </tr>

                            <!-- Level 3: Movement Details -->
                            <tr v-if="expandedProducts.has(`${order.effective_order_number}_${product.parent_product_id}`)" class="bg-muted/30">
                              <td colspan="7" class="p-0">
                                <div class="p-3 pl-8">
                                  <div v-if="loadingMovements[`${order.effective_order_number}_${product.parent_product_id}`]" class="py-6 flex justify-center text-muted-foreground">
                                    <Loader2 class="w-4 h-4 animate-spin mr-2" />
                                    {{ t('common.loading') }}
                                  </div>
                                  <table v-else class="w-full text-xs border border-border rounded-md overflow-hidden">
                                    <thead class="bg-muted/50">
                                      <tr>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.time') }}</th>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.type') }}</th>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.from') }}</th>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.to') }}</th>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.quantity') }}</th>
                                        <th class="text-left p-2 font-medium text-muted-foreground">{{ t('productTracking.comment') }}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr
                                        v-for="movement in productMovements[`${order.effective_order_number}_${product.parent_product_id}`]"
                                        :key="movement.id"
                                        class="border-b border-border last:border-b-0"
                                      >
                                        <td class="p-2 text-muted-foreground">{{ formatDateTime(movement.occurred_at) }}</td>
                                        <td class="p-2 text-foreground">{{ t(`movementTypes.${movement.movement_type}`) }}</td>
                                        <td class="p-2 text-muted-foreground">{{ movement.from_location }}</td>
                                        <td class="p-2 text-muted-foreground">{{ movement.to_location }}</td>
                                        <td class="p-2 text-muted-foreground">{{ movement.quantity }}</td>
                                        <td class="p-2 text-muted-foreground">{{ movement.comment || '-' }}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </template>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination for Orders -->
        <div v-if="!loadingOrders && orders.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
          <div class="text-sm text-muted-foreground">
            {{ t('common.showing') }} {{ ((ordersPagination.page - 1) * ordersPagination.limit) + 1 }} - {{ Math.min(ordersPagination.page * ordersPagination.limit, ordersPagination.total) }} {{ t('common.of') }} {{ ordersPagination.total }}
          </div>
          <div class="flex gap-2">
            <button
              @click="goToOrdersPage(ordersPagination.page - 1)"
              :disabled="ordersPagination.page === 1"
              class="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
            >
              {{ t('common.previous') }}
            </button>
            <button
              @click="goToOrdersPage(ordersPagination.page + 1)"
              :disabled="ordersPagination.page * ordersPagination.limit >= ordersPagination.total"
              class="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
            >
              {{ t('common.next') }}
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: Warehouse/Unassigned (WITHOUT order_number) -->
      <div v-if="activeTab === 'warehouse'" class="p-6 space-y-4">
        <!-- Filters for TAB 2 -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.search') }}</label>
            <div class="relative">
              <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                v-model="warehouseFilters.search"
                @input="debouncedFetchUnassigned"
                :placeholder="t('productTracking.searchUnassignedPlaceholder')"
                class="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_from') }}</label>
            <input
              type="date"
              v-model="warehouseFilters.dateFrom"
              @change="fetchUnassigned"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.date_to') }}</label>
            <input
              type="date"
              v-model="warehouseFilters.dateTo"
              @change="fetchUnassigned"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.movement_type') }}</label>
            <select
              v-model="warehouseFilters.movementType"
              @change="fetchUnassigned"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="type in movementTypes" :key="type" :value="type">{{ t(`movementTypes.${type}`) }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-muted-foreground">{{ t('common.location') }}</label>
            <select
              v-model="warehouseFilters.locationId"
              @change="fetchUnassigned"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="">{{ t('common.all') }}</option>
              <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
            </select>
          </div>
        </div>

        <!-- Unassigned Movements List -->
        <div v-if="loadingUnassigned" class="p-12 flex justify-center text-muted-foreground">
          <Loader2 class="w-6 h-6 animate-spin mr-2" />
          {{ t('common.loading') }}
        </div>
        <div v-else-if="unassignedMovements.length === 0" class="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
          <Package class="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p>{{ t('productTracking.noUnassigned') }}</p>
        </div>
        <div v-else class="border border-border rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted/50 border-b border-border">
              <tr>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.productName') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.sku') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.time') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.type') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.from') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.to') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground">{{ t('productTracking.quantity') }}</th>
                <th class="text-left p-3 font-medium text-muted-foreground w-24">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="movement in unassignedMovements"
                :key="movement.id"
                class="border-b border-border hover:bg-accent/30 transition-colors"
              >
                <td class="p-3 text-foreground">{{ movement.parent_product?.product_name || '-' }}</td>
                <td class="p-3 text-muted-foreground">{{ movement.parent_product?.sku || '-' }}</td>
                <td class="p-3 text-muted-foreground">{{ formatDateTime(movement.occurred_at) }}</td>
                <td class="p-3 text-foreground">{{ t(`movementTypes.${movement.movement_type}`) }}</td>
                <td class="p-3 text-muted-foreground">{{ movement.from_location?.name || '-' }}</td>
                <td class="p-3 text-muted-foreground">{{ movement.to_location?.name || '-' }}</td>
                <td class="p-3 text-muted-foreground">{{ movement.quantity }}</td>
                <td class="p-3">
                  <button
                    v-if="canAssign && !isRestricted(movement.movement_type)"
                    @click="openAssignModal(movement)"
                    class="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {{ t('productTracking.assign') }}
                  </button>
                  <span v-else class="text-xs text-muted-foreground italic">
                    {{ isRestricted(movement.movement_type) ? t('productTracking.restricted') : t('productTracking.noPermission') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination for Unassigned -->
        <div v-if="!loadingUnassigned && unassignedMovements.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
          <div class="text-sm text-muted-foreground">
            {{ t('common.showing') }} {{ ((unassignedPagination.page - 1) * unassignedPagination.limit) + 1 }} - {{ Math.min(unassignedPagination.page * unassignedPagination.limit, unassignedPagination.total) }} {{ t('common.of') }} {{ unassignedPagination.total }}
          </div>
          <div class="flex gap-2">
            <button
              @click="goToUnassignedPage(unassignedPagination.page - 1)"
              :disabled="unassignedPagination.page === 1"
              class="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
            >
              {{ t('common.previous') }}
            </button>
            <button
              @click="goToUnassignedPage(unassignedPagination.page + 1)"
              :disabled="unassignedPagination.page * unassignedPagination.limit >= unassignedPagination.total"
              class="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
            >
              {{ t('common.next') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignment Modal -->
    <div
      v-if="showAssignModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="closeAssignModal"
    >
      <div class="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('productTracking.assignOrderNumber') }}</h3>
        
        <div class="space-y-4">
          <!-- Order Number Input with Autocomplete -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-foreground">{{ t('productTracking.orderNumber') }}</label>
            <input
              ref="orderNumberInput"
              v-model="assignForm.orderNumber"
              @input="handleOrderNumberInput"
              @focus="showSuggestions = true"
              :placeholder="t('productTracking.orderNumberPlaceholder')"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            />
            <!-- Autocomplete Dropdown -->
            <div v-if="showSuggestions && suggestions.length > 0" class="mt-1 border border-border rounded-md bg-background shadow-lg max-h-48 overflow-y-auto">
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.order_number"
                @click="selectSuggestion(suggestion.order_number)"
                class="px-3 py-2 text-sm hover:bg-accent cursor-pointer text-foreground"
              >
                {{ suggestion.order_number }}
              </div>
            </div>
          </div>

          <!-- Comment (required for WRITE_OFF/DAMAGE) -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-foreground">
              {{ t('productTracking.comment') }}
              <span v-if="requiresComment" class="text-destructive">*</span>
            </label>
            <textarea
              v-model="assignForm.comment"
              :placeholder="t('productTracking.commentPlaceholder')"
              rows="3"
              class="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
            ></textarea>
          </div>

          <!-- Error Message -->
          <div v-if="assignError" class="text-sm text-destructive">
            {{ assignError }}
          </div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button
              @click="closeAssignModal"
              class="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors text-foreground"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="submitAssignment"
              :disabled="assignLoading || !assignForm.orderNumber.trim()"
              class="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Loader2 v-if="assignLoading" class="w-4 h-4 animate-spin" />
              {{ t('productTracking.assignButton') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import { 
  Search, 
  Package, 
  Loader2, 
  ChevronRight 
} from 'lucide-vue-next';

const { t } = useI18n();
const authStore = useAuthStore();

// Tabs
const activeTab = ref<'marketplace' | 'warehouse'>('marketplace');

// Permissions
const canAssign = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || role === 'staff';
});

// Movement types
const movementTypes = ['SELLER_TO_BM', 'BM_TO_MARKETPLACE', 'MARKETPLACE_SALE', 'CUSTOMER_RETURN', 'MARKETPLACE_TO_BM_RETURN', 'BM_TO_SELLER', 'WRITE_OFF', 'DAMAGE', 'ADJUSTMENT', 'STATUS_CHANGE'];
const STRICTLY_RESTRICTED_TYPES = ['ADJUSTMENT'];
const COMMENT_REQUIRED_TYPES = ['WRITE_OFF', 'DAMAGE'];

const isRestricted = (type: string) => STRICTLY_RESTRICTED_TYPES.includes(type);
const requiresComment = computed(() => 
  selectedMovement.value && COMMENT_REQUIRED_TYPES.includes(selectedMovement.value.movement_type)
);

// Locations (for filters)
const locations = ref<any[]>([]);

// TAB 1: Marketplace Movements
const marketplaceFilters = reactive({
  search: '',
  dateFrom: '',
  dateTo: '',
  movementType: '',
  locationId: '',
});

const orders = ref<any[]>([]);
const loadingOrders = ref(false);
const ordersPagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});
const expandedOrders = ref<Set<string>>(new Set());
const orderProducts = ref<Record<string, any[]>>({});
const loadingProducts = ref<Record<string, boolean>>({});

const expandedProducts = ref<Set<string>>(new Set());
const productMovements = ref<Record<string, any[]>>({});
const loadingMovements = ref<Record<string, boolean>>({});

// TAB 2: Warehouse/Unassigned
const warehouseFilters = reactive({
  search: '',
  dateFrom: '',
  dateTo: '',
  movementType: '',
  locationId: '',
});

const unassignedMovements = ref<any[]>([]);
const loadingUnassigned = ref(false);
const unassignedPagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// Assignment Modal
const showAssignModal = ref(false);
const selectedMovement = ref<any>(null);
const assignForm = reactive({
  orderNumber: '',
  comment: '',
});
const assignLoading = ref(false);
const assignError = ref('');
const orderNumberInput = ref<HTMLInputElement | null>(null);

// Autocomplete
const suggestions = ref<any[]>([]);
const showSuggestions = ref(false);
let suggestionsTimeout: any = null;

// Debounce helpers
let ordersDebounceTimeout: any = null;
let unassignedDebounceTimeout: any = null;

const debouncedFetchOrders = () => {
  clearTimeout(ordersDebounceTimeout);
  ordersDebounceTimeout = setTimeout(() => fetchOrders(), 300);
};

const debouncedFetchUnassigned = () => {
  clearTimeout(unassignedDebounceTimeout);
  unassignedDebounceTimeout = setTimeout(() => fetchUnassigned(), 300);
};

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await api.get('/locations');
    locations.value = response.data;
  } catch (error) {
    console.error('Failed to fetch locations:', error);
  }
};

// TAB 1: Fetch Orders
const fetchOrders = async () => {
  loadingOrders.value = true;
  try {
    const params = new URLSearchParams();
    if (marketplaceFilters.search) params.append('search', marketplaceFilters.search);
    if (marketplaceFilters.dateFrom) params.append('dateFrom', marketplaceFilters.dateFrom);
    if (marketplaceFilters.dateTo) params.append('dateTo', marketplaceFilters.dateTo);
    if (marketplaceFilters.movementType) params.append('movementType', marketplaceFilters.movementType);
    if (marketplaceFilters.locationId) params.append('locationId', marketplaceFilters.locationId);
    // CRITICAL: Add pagination params
    params.append('limit', ordersPagination.limit.toString());
    params.append('offset', ((ordersPagination.page - 1) * ordersPagination.limit).toString());

    const response = await api.get(`/product-tracking/orders?${params.toString()}`);
    orders.value = response.data.data || [];
    ordersPagination.total = response.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch orders:', error);
  } finally {
    loadingOrders.value = false;
  }
};

const goToOrdersPage = (page: number) => {
  ordersPagination.page = page;
  fetchOrders();
};

// Toggle order expansion and fetch products
const toggleOrderExpansion = async (orderNumber: string) => {
  if (expandedOrders.value.has(orderNumber)) {
    expandedOrders.value.delete(orderNumber);
  } else {
    expandedOrders.value.add(orderNumber);
    // Fetch products if not already loaded
    if (!orderProducts.value[orderNumber]) {
      loadingProducts.value[orderNumber] = true;
      try {
        const response = await api.get(`/product-tracking/orders/${orderNumber}/products`);
        orderProducts.value[orderNumber] = response.data || [];
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        loadingProducts.value[orderNumber] = false;
      }
    }
  }
};

// Toggle product expansion and fetch movements
const toggleProductExpansion = async (orderNumber: string, productId: string) => {
  const key = `${orderNumber}_${productId}`;
  if (expandedProducts.value.has(key)) {
    expandedProducts.value.delete(key);
  } else {
    expandedProducts.value.add(key);
    // Fetch movements if not already loaded
    if (!productMovements.value[key]) {
      loadingMovements.value[key] = true;
      try {
        const response = await api.get(`/product-tracking/orders/${orderNumber}/products/${productId}/movements`);
        productMovements.value[key] = response.data || [];
      } catch (error) {
        console.error('Failed to fetch movements:', error);
      } finally {
        loadingMovements.value[key] = false;
      }
    }
  }
};

// TAB 2: Fetch Unassigned
const fetchUnassigned = async () => {
  loadingUnassigned.value = true;
  try {
    const params = new URLSearchParams();
    if (warehouseFilters.search) params.append('search', warehouseFilters.search);
    if (warehouseFilters.dateFrom) params.append('dateFrom', warehouseFilters.dateFrom);
    if (warehouseFilters.dateTo) params.append('dateTo', warehouseFilters.dateTo);
    if (warehouseFilters.movementType) params.append('movementType', warehouseFilters.movementType);
    if (warehouseFilters.locationId) params.append('locationId', warehouseFilters.locationId);
    // CRITICAL: Add pagination params
    params.append('limit', unassignedPagination.limit.toString());
    params.append('offset', ((unassignedPagination.page - 1) * unassignedPagination.limit).toString());

    const response = await api.get(`/product-tracking/unassigned?${params.toString()}`);
    unassignedMovements.value = response.data.data || [];
    unassignedPagination.total = response.data.total || 0;
  } catch (error) {
    console.error('Failed to fetch unassigned movements:', error);
  } finally {
    loadingUnassigned.value = false;
  }
};

const goToUnassignedPage = (page: number) => {
  unassignedPagination.page = page;
  fetchUnassigned();
};

// Assignment Modal
const openAssignModal = (movement: any) => {
  selectedMovement.value = movement;
  assignForm.orderNumber = '';
  assignForm.comment = '';
  assignError.value = '';
  showAssignModal.value = true;
  setTimeout(() => orderNumberInput.value?.focus(), 100);
};

const closeAssignModal = () => {
  showAssignModal.value = false;
  selectedMovement.value = null;
  showSuggestions.value = false;
  suggestions.value = [];
};

// Autocomplete
const handleOrderNumberInput = () => {
  clearTimeout(suggestionsTimeout);
  suggestionsTimeout = setTimeout(async () => {
    const query = assignForm.orderNumber.trim();
    if (query.length >= 2) {
      try {
        const response = await api.get(`/product-tracking/order-suggestions?q=${query}`);
        suggestions.value = response.data || [];
        showSuggestions.value = true;
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    } else {
      suggestions.value = [];
    }
  }, 300);
};

const selectSuggestion = (orderNumber: string) => {
  assignForm.orderNumber = orderNumber;
  showSuggestions.value = false;
  suggestions.value = [];
};

// Submit Assignment
const submitAssignment = async () => {
  assignError.value = '';

  // Validation
  if (!assignForm.orderNumber.trim()) {
    assignError.value = t('productTracking.errors.orderNumberRequired');
    return;
  }

  if (requiresComment.value && !assignForm.comment.trim()) {
    assignError.value = t('productTracking.errors.commentRequired');
    return;
  }

  assignLoading.value = true;
  try {
    await api.patch(`/product-tracking/movements/${selectedMovement.value.id}/assign-order`, {
      order_number: assignForm.orderNumber.trim(),
      comment: assignForm.comment.trim() || undefined,
    });

    // Success - refresh unassigned list and close modal
    closeAssignModal();
    await fetchUnassigned();
  } catch (error: any) {
    assignError.value = error.response?.data?.message || t('productTracking.errors.assignmentFailed');
  } finally {
    assignLoading.value = false;
  }
};

// Date formatting
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString();
};

// Watchers for tab switches
watch(activeTab, (newTab) => {
  if (newTab === 'marketplace' && orders.value.length === 0) {
    fetchOrders();
  } else if (newTab === 'warehouse' && unassignedMovements.value.length === 0) {
    fetchUnassigned();
  }
});

// Click outside to close suggestions
watch(showSuggestions, (show) => {
  if (show) {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.suggestion-container')) {
        showSuggestions.value = false;
        document.removeEventListener('click', handleClickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  }
});

onMounted(() => {
  fetchLocations();
  fetchOrders();
});
</script>
