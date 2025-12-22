import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceProduct } from './marketplace-product.entity';

@Injectable()
export class MarketplaceProductsService {
    constructor(
        @InjectRepository(MarketplaceProduct)
        private marketplaceProductsRepository: Repository<MarketplaceProduct>,
    ) { }

    async findAll(): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsRepository.find({
            relations: ['store'],
        });
    }

    async findOne(id: string): Promise<MarketplaceProduct | null> {
        return this.marketplaceProductsRepository.findOne({
            where: { id },
            relations: ['store'],
        });
    }

    async findByStore(storeId: string): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsRepository.find({
            where: { store_id: storeId },
            relations: ['store'],
        });
    }

    async create(productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        const product = this.marketplaceProductsRepository.create(productData);
        return this.marketplaceProductsRepository.save(product);
    }

    async update(id: string, productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        await this.marketplaceProductsRepository.update(id, productData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.marketplaceProductsRepository.delete(id);
    }
}
