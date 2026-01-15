import { Injectable } from '@nestjs/common';
import { MarketplaceClient } from './marketplace-client.interface';
import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';

/**
 * Mock implementation of MarketplaceClient for development and testing.
 * 
 * Supports two modes:
 * - RANDOM: Random success/failure for manual testing
 * - DETERMINISTIC: Predictable results for unit/integration tests
 */
@Injectable()
export class MockMarketplaceClient implements MarketplaceClient {
    private readonly mode: 'RANDOM' | 'DETERMINISTIC';

    constructor() {
        const envMode = process.env.MOCK_MARKETPLACE_MODE;
        this.mode = envMode === 'DETERMINISTIC' ? 'DETERMINISTIC' : 'RANDOM';
    }

    /**
     * Test marketplace connection.
     * RANDOM: 80% success rate with 500ms delay
     * DETERMINISTIC: Always succeeds
     */
    async testConnection(credentials: any): Promise<boolean> {
        // Simulate API delay
        await this.delay(500);

        if (this.mode === 'DETERMINISTIC') {
            return true;
        }

        // RANDOM mode: 80% success rate
        return Math.random() < 0.8;
    }

    /**
     * Sync products from marketplace.
     * RANDOM: Returns 5-10 random products
     * DETERMINISTIC: Returns fixed set of 5 products
     */
    async syncProducts(storeId: string): Promise<Partial<MarketplaceProduct>[]> {
        // Simulate API delay
        await this.delay(1000);

        if (this.mode === 'DETERMINISTIC') {
            return this.getDeterministicProducts(storeId);
        }

        // RANDOM mode: generate 5-10 random products
        const count = 5 + Math.floor(Math.random() * 6);
        return this.getRandomProducts(count, storeId);
    }

    /**
     * Update stock for a product.
     * Both modes: Always succeeds
     */
    async updateStock(productId: string, stock: number): Promise<boolean> {
        // Simulate API delay
        await this.delay(300);

        // Always succeed for both modes
        return true;
    }

    /**
     * Helper: Delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper: Generate deterministic product set for testing
     */
    private getDeterministicProducts(storeId: string): Partial<MarketplaceProduct>[] {
        return [
            {
                external_product_id: 'MOCK-SKU-001',
                title: 'Мокап кроссовки Nike Air Max',
                raw_payload: { mock: true, price_uzs: '100000', status: 'ACTIVE' },
            },
            {
                external_product_id: 'MOCK-SKU-002',
                title: 'Мокап футболка Adidas',
                raw_payload: { mock: true, price_uzs: '150000', status: 'ACTIVE' },
            },
            {
                external_product_id: 'MOCK-SKU-003',
                title: 'Мокап джинсы Levi\'s',
                raw_payload: { mock: true, price_uzs: '200000', status: 'OUT_OF_STOCK' },
            },
            {
                external_product_id: 'MOCK-SKU-004',
                title: 'Мокап куртка Zara',
                raw_payload: { mock: true, price_uzs: '75000', status: 'ACTIVE' },
            },
            {
                external_product_id: 'MOCK-SKU-005',
                title: 'Мокап платье H&M',
                raw_payload: { mock: true, price_uzs: '300000', status: 'ACTIVE' },
            },
        ];
    }

    /**
     * Helper: Generate random products for manual testing
     */
    private getRandomProducts(count: number, storeId: string): Partial<MarketplaceProduct>[] {
        const products: Partial<MarketplaceProduct>[] = [];

        for (let i = 0; i < count; i++) {
            products.push({
                external_product_id: `MOCK-SKU-${100 + i}`,
                title: `Тестовый товар ${i + 1}`,
                raw_payload: {
                    mock: true,
                    price_uzs: String(50000 + Math.floor(Math.random() * 450000)),
                    stock: Math.floor(Math.random() * 50),
                    status: Math.random() > 0.2 ? 'ACTIVE' : 'OUT_OF_STOCK'
                },
            });
        }

        return products;
    }
}
