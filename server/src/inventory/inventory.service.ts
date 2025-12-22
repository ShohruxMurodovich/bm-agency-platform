import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Inventory)
        private inventoryRepository: Repository<Inventory>,
    ) { }

    async findAll(): Promise<Inventory[]> {
        return this.inventoryRepository.find({
            relations: ['seller', 'parent_product'],
        });
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

    async update(id: string, inventoryData: Partial<Inventory>): Promise<Inventory> {
        await this.inventoryRepository.update(id, inventoryData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.inventoryRepository.delete(id);
    }
}
