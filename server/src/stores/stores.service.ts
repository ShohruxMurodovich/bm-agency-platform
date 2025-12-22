import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';

@Injectable()
export class StoresService {
    constructor(
        @InjectRepository(Store)
        private storesRepository: Repository<Store>,
    ) { }

    async findAll(user: any): Promise<Store[]> {
        if (user.role === 'seller') {
            const seller = await this.storesRepository.manager.findOne('Seller', { where: { user_id: user.id } });
            if (!seller) return [];
            return this.storesRepository.find({
                where: { seller_id: (seller as any).id },
                relations: ['seller', 'marketplace']
            });
        }
        return this.storesRepository.find({ relations: ['seller', 'marketplace'] });
    }

    async findOne(id: string): Promise<Store | null> {
        return this.storesRepository.findOne({ where: { id }, relations: ['seller', 'marketplace'] });
    }

    async create(storeData: any, user: any): Promise<Store> {
        // Map frontend data to entity
        const entityData: Partial<Store> = {
            name: storeData.store_name,
            external_shop_id: storeData.external_store_id,
        };

        // Map marketplace string to ID (Mock implementation - usually should query DB)
        const marketplaceMap: Record<string, number> = {
            'wb': 1,
            'ozon': 2,
            'yandex': 3,
            'aliexpress': 4,
            'uzum': 5, // Assuming additional IDs
            'alif': 6
        };
        if (storeData.marketplace && marketplaceMap[storeData.marketplace]) {
            entityData.marketplace_id = marketplaceMap[storeData.marketplace];
        } else {
            // Fallback or default? or keep existing if update
            // If creating and no ID, maybe error or default 1
            entityData.marketplace_id = 1;
        }

        // Handle seller_id
        // If user is admin/staff and provides user_id, convert to seller_id
        if (storeData.user_id) {
            const seller = await this.storesRepository.manager.findOne('Seller', { where: { user_id: storeData.user_id } });
            if (seller) {
                entityData.seller_id = (seller as any).id;
            }
        } else if (user.role === 'seller') {
            const seller = await this.storesRepository.manager.findOne('Seller', { where: { user_id: user.id } });
            if (seller) {
                entityData.seller_id = (seller as any).id;
            }
        }

        const store = this.storesRepository.create(entityData);
        return this.storesRepository.save(store);
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
