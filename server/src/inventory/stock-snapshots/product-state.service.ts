import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductState } from './product-state.entity';

@Injectable()
export class ProductStateService {
    constructor(
        @InjectRepository(ProductState)
        private productStateRepo: Repository<ProductState>,
    ) { }

    async findAll(filters?: {
        productSearch?: string;
        locationId?: string;
        statusId?: string;
        showZeroQty?: boolean;
    }): Promise<ProductState[]> {
        const query = this.productStateRepo.createQueryBuilder('state')
            .leftJoinAndSelect('state.parent_product', 'product')
            .leftJoinAndSelect('state.location', 'location')
            .leftJoinAndSelect('state.business_status', 'status');

        // Apply filters
        if (filters?.productSearch) {
            query.andWhere(
                '(product.product_name ILIKE :search OR product.id::text ILIKE :search)',
                { search: `%${filters.productSearch}%` }
            );
        }

        if (filters?.locationId) {
            query.andWhere('state.location_id = :locationId', { locationId: filters.locationId });
        }

        if (filters?.statusId) {
            query.andWhere('state.business_status_id = :statusId', { statusId: filters.statusId });
        }

        if (!filters?.showZeroQty) {
            query.andWhere('state.quantity > 0');
        }

        return query
            .orderBy('product.product_name', 'ASC')
            .addOrderBy('location.name', 'ASC')
            .getMany();
    }

    async findOne(id: string): Promise<ProductState> {
        return this.productStateRepo.findOne({
            where: { id },
            relations: ['parent_product', 'location', 'business_status'],
        });
    }
}
