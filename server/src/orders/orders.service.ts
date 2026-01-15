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

    async findAll(user: any): Promise<Order[]> {
        const queryBuilder = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.store', 'store')
            .leftJoinAndSelect('store.marketplace', 'marketplace')
            .leftJoinAndSelect('store.seller', 'seller')
            .leftJoinAndSelect('order.order_items', 'order_items')
            .leftJoinAndSelect('order_items.marketplace_product', 'marketplace_product');

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
