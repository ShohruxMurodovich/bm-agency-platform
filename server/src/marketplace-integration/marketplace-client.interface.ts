import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';

/**
 * Interface for marketplace API client implementations.
 * Abstracts marketplace-specific API calls for testing and real integrations.
 */
export interface MarketplaceClient {
    /**
     * Test connection to marketplace API with provided credentials.
     * @returns true if connection successful, false otherwise
     */
    testConnection(credentials: any): Promise<boolean>;

    /**
     * Sync products from marketplace for a given store.
     * @param storeId - ID of the store to sync
     * @returns Array of marketplace products
     */
    syncProducts(storeId: string): Promise<Partial<MarketplaceProduct>[]>;

    /**
     * Update stock quantity for a marketplace product.
     * @param productId - External marketplace product ID
     * @param stock - New stock quantity
     * @returns true if update successful, false otherwise
     */
    updateStock(productId: string, stock: number): Promise<boolean>;
}
