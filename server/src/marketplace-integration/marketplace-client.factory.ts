import { Injectable } from '@nestjs/common';
import { MarketplaceClient } from './marketplace-client.interface';
import { MockMarketplaceClient } from './mock-marketplace-client.service';

/**
 * Factory to provide the appropriate MarketplaceClient implementation.
 * 
 * Based on USE_REAL_MARKETPLACE_API environment variable:
 * - false (default): Returns MockMarketplaceClient
 * - true: Returns real marketplace client (to be implemented)
 */
@Injectable()
export class MarketplaceClientFactory {
    private static instance: MarketplaceClient;

    /**
     * Get marketplace client instance based on feature flag.
     */
    static getClient(): MarketplaceClient {
        if (!this.instance) {
            const useRealApi = process.env.USE_REAL_MARKETPLACE_API === 'true';

            if (useRealApi) {
                // TODO: Implement real marketplace client in Phase 2+
                throw new Error('Real marketplace API integration not yet implemented');
            }

            // Default: use mock client
            this.instance = new MockMarketplaceClient();
        }

        return this.instance;
    }
}
