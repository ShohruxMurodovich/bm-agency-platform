import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { OrderItem } from './order-item.entity';

@Controller('order-items')
export class OrderItemsController {
    constructor(private readonly orderItemsService: OrderItemsService) { }

    @Get()
    findAll(): Promise<OrderItem[]> {
        return this.orderItemsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<OrderItem> {
        return this.orderItemsService.findOne(id);
    }

    @Post()
    create(@Body() orderItemData: Partial<OrderItem>): Promise<OrderItem> {
        return this.orderItemsService.create(orderItemData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() orderItemData: Partial<OrderItem>): Promise<OrderItem> {
        return this.orderItemsService.update(id, orderItemData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.orderItemsService.remove(id);
    }
}
