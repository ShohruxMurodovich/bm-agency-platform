import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMapping } from './product-mapping.entity';

@Injectable()
export class ProductMappingService {
    constructor(
        @InjectRepository(ProductMapping)
        private productMappingRepository: Repository<ProductMapping>,
    ) { }

    async findAll(): Promise<ProductMapping[]> {
        return this.productMappingRepository.find({
            relations: ['parent_product', 'marketplace_product', 'matched_by_user'],
        });
    }

    async findOne(id: string): Promise<ProductMapping | null> {
        return this.productMappingRepository.findOne({
            where: { id },
            relations: ['parent_product', 'marketplace_product', 'matched_by_user'],
        });
    }

    async findByParentProduct(parentProductId: string): Promise<ProductMapping[]> {
        return this.productMappingRepository.find({
            where: { parent_product_id: parentProductId },
            relations: ['marketplace_product'],
        });
    }

    async create(mappingData: Partial<ProductMapping>): Promise<ProductMapping> {
        const mapping = this.productMappingRepository.create(mappingData);
        return this.productMappingRepository.save(mapping);
    }

    async update(id: string, mappingData: Partial<ProductMapping>): Promise<ProductMapping> {
        await this.productMappingRepository.update(id, mappingData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.productMappingRepository.delete(id);
    }
}
