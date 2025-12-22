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
        if (user.role === 'seller') {
            const seller = await this.ordersRepository.manager.findOne('Seller', { where: { user_id: user.id } });
            if (!seller) return [];
            return this.ordersRepository.find({
                where: { store: { seller_id: (seller as any).id } },
                relations: ['store', 'order_items', 'order_items.marketplace_product']
            });
        }
        return this.ordersRepository.find({ relations: ['store', 'order_items', 'order_items.marketplace_product'] });
    }

    async findOne(id: string): Promise<Order | null> {
        return this.ordersRepository.findOne({
            where: { id },
            relations: ['store', 'order_items', 'order_items.marketplace_product']
        });
    }
}
