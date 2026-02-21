import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
    ) { }

    async findAll(user: any, query?: any): Promise<Order[]> {
        const queryBuilder = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.store', 'store')
            .leftJoinAndSelect('store.marketplace', 'marketplace')
            .leftJoinAndSelect('store.seller', 'seller')
            .leftJoinAndSelect('order.order_items', 'order_items')
            .leftJoinAndSelect('order_items.marketplace_product', 'marketplace_product');

        if (query) {
            if (query.store_id) {
                queryBuilder.andWhere('store.id = :storeId', { storeId: query.store_id });
            }
            if (query.status) {
                queryBuilder.andWhere('order.status = :status', { status: query.status });
            }
            if (query.date_from) {
                queryBuilder.andWhere('order.created_at >= :dateFrom', { dateFrom: query.date_from });
            }
            if (query.date_to) {
                queryBuilder.andWhere('order.created_at <= :dateTo', { dateTo: query.date_to });
            }
            if (query.product_search) {
                queryBuilder.andWhere(
                    '(marketplace_product.sku_name ILIKE :search OR order.invoiceNumber ILIKE :search OR marketplace_product.offer_id ILIKE :search)',
                    { search: `%${query.product_search}%` }
                );
            }
        }

        // Tenant isolation: seller/public_user only see their own orders
        if (user.role === 'seller' || user.role === 'public_user') {
            const sellerId = user.seller_id;

            if (!sellerId) {
                // If no seller_id, try to find by user_id
                const seller = await this.ordersRepository.manager.findOne('Seller', { where: { user_id: user.userId } });
                if (!seller) return [];
                queryBuilder.andWhere('store.seller_id = :sellerId', { sellerId: (seller as any).id });
            } else {
                queryBuilder.andWhere('store.seller_id = :sellerId', { sellerId });
            }
        } else if (query && query.seller_id) {
            queryBuilder.andWhere('store.seller_id = :sellerId', { sellerId: query.seller_id });
        }

        return queryBuilder
            .orderBy('order.created_at', 'DESC')
            .getMany();
    }

    async findOne(id: string): Promise<Order | null> {
        return this.ordersRepository.findOne({
            where: { id },
            relations: ['store', 'order_items', 'order_items.marketplace_product']
        });
    }
}
