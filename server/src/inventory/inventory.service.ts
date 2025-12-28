import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { ProductMovementService } from '../product-movement/product-movement.service';
import { MovementType, InitiatorType } from '../product-movement/product-movement.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,
        @Inject(forwardRef(() => ProductMovementService))
        private productMovementService: ProductMovementService,
    ) { }

    async findAll(filters: {
        seller_id?: string;
        store_id?: string;
        search?: string;
        stock_status?: string;
    } = {}): Promise<Inventory[]> {
        const query = this.inventoryRepository.createQueryBuilder('inventory')
            .leftJoinAndSelect('inventory.seller', 'seller')
            .leftJoinAndSelect('inventory.parent_product', 'product');

        if (filters.seller_id) {
            query.andWhere('inventory.seller_id = :sellerId', { sellerId: filters.seller_id });
        }

        if (filters.store_id) {
            // Filter by the seller who owns the store (schema limitation: inventory is seller-level)
            query.leftJoin('seller.stores', 'store')
                .andWhere('store.id = :storeId', { storeId: filters.store_id });
        }

        if (filters.search) {
            query.andWhere('product.product_name ILIKE :search', { search: `%${filters.search}%` });
        }

        if (filters.stock_status) {
            if (filters.stock_status === 'out_of_stock') {
                query.andWhere('inventory.quantity = 0');
            } else if (filters.stock_status === 'low_stock') {
                query.andWhere('inventory.quantity > 0 AND inventory.quantity < 10');
            } else if (filters.stock_status === 'in_stock') {
                query.andWhere('inventory.quantity >= 10');
            }
        }

        return query.getMany();
    }

    async findOne(id: string): Promise<Inventory | null> {
        return this.inventoryRepository.findOne({
            where: { id },
            relations: ['seller', 'parent_product'],
        });
    }

    async findBySeller(sellerId: string): Promise<Inventory[]> {
        return this.inventoryRepository.find({
            where: { seller_id: sellerId },
            relations: ['parent_product'],
        });
    }

    async create(inventoryData: Partial<Inventory>): Promise<Inventory> {
        const inventory = this.inventoryRepository.create(inventoryData);
        return this.inventoryRepository.save(inventory);
    }

    async update(id: string, inventoryData: Partial<Inventory>, initiatorId?: string): Promise<Inventory> {
        // Fetch current inventory to calculate delta
        const currentInventory = await this.findOne(id);
        if (!currentInventory) {
            throw new Error('Inventory not found');
        }

        // Calculate delta if quantity is being updated
        if (inventoryData.quantity !== undefined && inventoryData.quantity !== currentInventory.quantity) {
            const oldQuantity = currentInventory.quantity;
            const newQuantity = inventoryData.quantity;
            const delta = newQuantity - oldQuantity;

            // Create ADJUSTMENT movement record with delta
            await this.productMovementService.recordMovement({
                parent_product_id: currentInventory.parent_product_id,
                quantity: Math.abs(delta),
                movement_type: MovementType.ADJUSTMENT,
                // If increasing, from UNKNOWN to BM warehouse; if decreasing, from BM to LOST
                from_location_code: delta > 0 ? 'UNKNOWN' : 'BM_WH_MAIN',
                to_location_code: delta > 0 ? 'BM_WH_MAIN' : 'LOST',
                from_status_code: 'FREE',
                to_status_code: 'FREE',
                initiator_type: InitiatorType.USER,
                initiator_id: initiatorId,
                comment: `Inventory adjustment: ${delta > 0 ? '+' : ''}${delta} units (${oldQuantity} → ${newQuantity})`,
            });
        }

        // Update the inventory
        await this.inventoryRepository.update(id, inventoryData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.inventoryRepository.delete(id);
    }
}
