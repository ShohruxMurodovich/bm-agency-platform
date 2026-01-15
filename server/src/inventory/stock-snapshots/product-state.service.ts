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

    async findAll(filters: {
        parentProductId?: string;
        locationId?: string;
        statusId?: string;
        showZeroQty?: boolean;
        sellerId?: string;
        userRole?: string;
    }): Promise<ProductState[]> {
        const query = this.productStateRepo
            .createQueryBuilder('state')
            .leftJoinAndSelect('state.parent_product', 'parent_product')
            .leftJoinAndSelect('parent_product.seller', 'seller')
            .leftJoinAndSelect('state.location', 'location')
            .leftJoinAndSelect('state.business_status', 'business_status');

        // Tenant isolation for PUBLIC_USER
        if (filters.userRole === 'public_user' && filters.sellerId) {
            query.andWhere('parent_product.seller_id = :sellerId', { sellerId: filters.sellerId });
        }

        if (filters.parentProductId) {
            query.andWhere('state.parent_product_id = :parentProductId', {
                parentProductId: filters.parentProductId,
            });
        }

        if (filters.locationId) {
            query.andWhere('state.location_id = :locationId', {
                locationId: filters.locationId,
            });
        }

        if (filters.statusId) {
            query.andWhere('state.business_status_id = :statusId', {
                statusId: filters.statusId,
            });
        }

        if (!filters.showZeroQty) {
            query.andWhere('state.quantity > 0');
        }

        return query
            .orderBy('state.updated_at', 'DESC')
            .getMany();
    }

    async findOne(id: string): Promise<ProductState> {
        return this.productStateRepo.findOne({
            where: { id },
            relations: ['parent_product', 'location', 'business_status'],
        });
    }
}
