import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.ordersService.findAll(req.user);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }
}
