import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Inventory } from './inventory.entity';

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    findAll(): Promise<Inventory[]> {
        return this.inventoryService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Inventory> {
        return this.inventoryService.findOne(id);
    }

    @Post()
    create(@Body() inventoryData: Partial<Inventory>): Promise<Inventory> {
        return this.inventoryService.create(inventoryData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() inventoryData: Partial<Inventory>): Promise<Inventory> {
        return this.inventoryService.update(id, inventoryData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.inventoryService.remove(id);
    }
}
