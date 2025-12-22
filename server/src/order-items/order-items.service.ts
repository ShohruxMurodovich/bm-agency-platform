import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Injectable()
export class OrderItemsService {
    constructor(
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
    ) { }

    async findAll(): Promise<OrderItem[]> {
        return this.orderItemsRepository.find({
            relations: ['order', 'marketplace_product'],
        });
    }

    async findOne(id: string): Promise<OrderItem | null> {
        return this.orderItemsRepository.findOne({
            where: { id },
            relations: ['order', 'marketplace_product'],
        });
    }

    async findByOrder(orderId: string): Promise<OrderItem[]> {
        return this.orderItemsRepository.find({
            where: { order_id: orderId },
            relations: ['marketplace_product'],
        });
    }

    async create(orderItemData: Partial<OrderItem>): Promise<OrderItem> {
        const orderItem = this.orderItemsRepository.create(orderItemData);
        return this.orderItemsRepository.save(orderItem);
    }

    async update(id: string, orderItemData: Partial<OrderItem>): Promise<OrderItem> {
        await this.orderItemsRepository.update(id, orderItemData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.orderItemsRepository.delete(id);
    }
}
