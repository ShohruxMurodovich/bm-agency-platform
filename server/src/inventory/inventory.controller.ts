import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Inventory } from './inventory.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PUBLIC_USER)
    findAll(
        @Request() req,
        @Query('seller_id') seller_id?: string,
        @Query('store_id') store_id?: string,
        @Query('search') search?: string,
        @Query('stock_status') stock_status?: string,
    ): Promise<Inventory[]> {
        // Enforce tenant isolation for PUBLIC_USER
        const userRole = req.user.role;
        let effectiveSellerId = seller_id;

        if (userRole === 'public_user' && req.user.seller_id) {
            // Force PUBLIC_USER to only see their own inventory
            effectiveSellerId = req.user.seller_id;
        }

        return this.inventoryService.findAll({
            seller_id: effectiveSellerId,
            store_id,
            search,
            stock_status
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Inventory> {
        return this.inventoryService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    create(@Body() inventoryData: Partial<Inventory>): Promise<Inventory> {
        return this.inventoryService.create(inventoryData);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    update(@Param('id') id: string, @Body() inventoryData: Partial<Inventory>, @Request() req): Promise<Inventory> {
        return this.inventoryService.update(id, inventoryData, req.user.id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    remove(@Param('id') id: string): Promise<void> {
        return this.inventoryService.remove(id);
    }
}
