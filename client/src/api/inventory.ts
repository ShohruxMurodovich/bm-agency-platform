import api from '../api';

export interface InventorySummary {
    productId: string;
    totalStock: number;
    stockByLocation: Array<{
        location: string;
        location_type: string;
        qty: number;
    }>;
}

export interface InventoryMovement {
    id: string;
    occurred_at: string; // ISO date
    recorded_at: string;
    quantity: number;
    movement_type: string;
    from_location: { name: string; type: string };
    to_location: { name: string; type: string };
    resulting_status?: { code: string };
    initiator_type: string;
    comment?: string;
}

export const inventoryApi = {
    getSummary: async (productId: string): Promise<InventorySummary> => {
        const response = await api.get(`/product-movement/product/${productId}/inventory`);
        return response.data;
    },

    getHistory: async (productId: string): Promise<InventoryMovement[]> => {
        const response = await api.get(`/product-movement/product/${productId}/movements`);
        return response.data;
    },
};
