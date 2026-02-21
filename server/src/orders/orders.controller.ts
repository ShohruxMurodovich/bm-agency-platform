import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.COURIER, UserRole.PUBLIC_USER)
    async findAll(@Request() req: any, @Query() query: any) {
        return this.ordersService.findAll(req.user, query);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.COURIER, UserRole.PUBLIC_USER)
    async findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }
}
