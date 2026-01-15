import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { Seller } from '../sellers/seller.entity';
import { MarketplaceClientFactory } from '../marketplace-integration/marketplace-client.factory';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
        @InjectRepository(Seller)
        private sellersRepository: Repository<Seller>,
    ) { }

    async findAll(user: any): Promise<Store[]> {
        // For seller or public_user, filter by their seller_id
        if (user.role === 'seller' || user.role === 'public_user') {
            const seller = user.seller_id
                ? await this.storesRepository.manager.findOne('Seller', { where: { id: user.seller_id } })
                : await this.storesRepository.manager.findOne('Seller', { where: { user_id: user.userId } });

            if (!seller) return [];

            return this.storesRepository.find({
                where: { seller_id: (seller as any).id },
                relations: ['seller', 'seller.user', 'marketplace'],
                order: { created_at: 'DESC' },
            });
        }

        // Admin/staff see all stores
        return this.storesRepository.find({
            relations: ['seller', 'seller.user', 'marketplace'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Find stores by seller ID (tenant-filtered).
     * Used for PUBLIC_USER to get only their stores.
     */
    async findBySellerId(sellerId: string): Promise<Store[]> {
        if (!sellerId) return [];

        return this.storesRepository.find({
            where: { seller_id: sellerId },
            relations: ['seller', 'marketplace'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Check if seller has reached their store limit.
     * Returns true if limit reached, false otherwise.
     */
    async checkStoreLimit(sellerId: string): Promise<{ limitReached: boolean; current: number; max: number }> {
        const seller = await this.sellersRepository.findOne({ where: { id: sellerId } });
        if (!seller) {
            throw new BadRequestException('Seller not found');
        }

        const storeCount = await this.storesRepository.count({ where: { seller_id: sellerId } });

        return {
            limitReached: storeCount >= seller.max_stores,
            current: storeCount,
            max: seller.max_stores,
        };
    }

    async findOne(id: string): Promise<Store | null> {
        return this.storesRepository.findOne({ where: { id }, relations: ['seller', 'marketplace'] });
    }

    /**
     * Create a new store with limit check and connection test.
     */
    async create(storeData: any, user: any, sellerId?: string): Promise<Store> {
        // Determine seller ID
        let resolvedSellerId = sellerId;

        if (!resolvedSellerId) {
            if (storeData.user_id) {
                const seller = await this.storesRepository.manager.findOne('Seller', { where: { user_id: storeData.user_id } });
                if (seller) {
                    resolvedSellerId = (seller as any).id;
                }
            } else if (user.role === 'seller' || user.role === 'public_user') {
                const seller = await this.storesRepository.manager.findOne('Seller', { where: { user_id: user.userId } });
                if (seller) {
                    resolvedSellerId = (seller as any).id;
                }
            }
        }

        if (!resolvedSellerId) {
            throw new BadRequestException('Unable to determine seller ID');
        }

        // Check store limit for PUBLIC_USER
        if (user.role === 'public_user') {
            const limitCheck = await this.checkStoreLimit(resolvedSellerId);
            if (limitCheck.limitReached) {
                throw new ForbiddenException(
                    `Store limit reached (${limitCheck.current}/${limitCheck.max}). Upgrade your plan to add more stores.`
                );
            }
        }

        // Test marketplace connection (mock for now)
        const connectionTest = await this.testMarketplaceConnection(storeData);
        if (!connectionTest.success) {
            throw new BadRequestException(
                `Marketplace connection failed: ${connectionTest.message}`
            );
        }

        // Map frontend data to entity
        const entityData: Partial<Store> = {
            name: storeData.store_name,
            external_shop_id: storeData.external_store_id,
            seller_id: resolvedSellerId,
        };

        // Map marketplace string to ID
        const marketplaceMap: Record<string, number> = {
            'wb': 1,
            'ozon': 2,
            'yandex': 3,
            'aliexpress': 4,
            'uzum': 5,
            'alif': 6
        };
        if (storeData.marketplace && marketplaceMap[storeData.marketplace]) {
            entityData.marketplace_id = marketplaceMap[storeData.marketplace];
        } else {
            entityData.marketplace_id = 1;
        }

        const store = this.storesRepository.create(entityData);
        return this.storesRepository.save(store);
    }

    /**
     * Test marketplace connection using MarketplaceClientFactory.
     */
    private async testMarketplaceConnection(storeData: any): Promise<{ success: boolean; message?: string }> {
        try {
            const client = MarketplaceClientFactory.getClient();
            const result = await client.testConnection(storeData);

            return {
                success: result,
                message: result ? 'Connection successful' : 'Connection failed - check credentials',
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Unexpected error during connection test',
            };
        }
    }

    /**
     * Update store credentials and re-test connection.
     */
    async updateCredentials(id: string, credentials: any, user: any): Promise<Store> {
        const store = await this.findOne(id);
        if (!store) {
            throw new BadRequestException('Store not found');
        }

        // For PUBLIC_USER, verify ownership
        if (user.role === 'public_user' && store.seller_id !== user.seller_id) {
            throw new ForbiddenException('You can only update your own stores');
        }

        // Test new credentials
        const connectionTest = await this.testMarketplaceConnection({
            ...store,
            ...credentials,
        });

        if (!connectionTest.success) {
            throw new BadRequestException(
                `Connection test failed: ${connectionTest.message}`
            );
        }

        // Update credentials (this would normally update StoreCredential entity)
        // For now, we'll just update the store
        await this.storesRepository.update(id, {});

        return this.findOne(id);
    }

    async update(id: string, storeData: any): Promise<Store | null> {
        const updateData: any = {};
        if (storeData.store_name) updateData.name = storeData.store_name;
        if (storeData.external_store_id) updateData.external_shop_id = storeData.external_store_id;

        const marketplaceMap: Record<string, number> = {
            'wb': 1,
            'ozon': 2,
            'yandex': 3,
            'aliexpress': 4,
            'uzum': 5,
            'alif': 6
        };
        if (storeData.marketplace && marketplaceMap[storeData.marketplace]) {
            updateData.marketplace_id = marketplaceMap[storeData.marketplace];
        }

        await this.storesRepository.update(id, updateData);
        return this.findOne(id);
    }

    async getMarketplaceProducts(storeId: string, search?: string): Promise<any[]> {
        const queryBuilder = this.storesRepository
            .createQueryBuilder('store')
            .leftJoinAndSelect('store.marketplace_products', 'product')
            .where('store.id = :storeId', { storeId });

        if (search) {
            queryBuilder.andWhere(
                '(product.title ILIKE :search OR product.external_product_id ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        const store = await queryBuilder.getOne();
        return store?.marketplace_products || [];
    }

    async remove(id: string): Promise<void> {
        await this.storesRepository.delete(id);
    }
}
