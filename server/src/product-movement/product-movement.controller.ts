import { Controller, Get, Post, Put, Body, Param, Request, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { ProductMovementService } from './product-movement.service';
import { ProductMovementRequest } from './product-movement-request.entity';

@Controller('product-movement')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductMovementController {
    constructor(private readonly productMovementService: ProductMovementService) { }

    @Post('send')
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    createSendRequest(
        @Request() req,
        @Body() data: {
            products: Array<{ parent_product_id: string; quantity: number }>;
            notes?: string;
            seller_id?: string; // For admin to specify seller
        }
    ): Promise<ProductMovementRequest> {
        return this.productMovementService.createSendRequest(req.user.id, data);
    }

    @Post('return')
    @Roles(UserRole.COURIER, UserRole.ADMIN)
    createReturnRequest(
        @Request() req,
        @Body() data: {
            seller_id: string;
            products: Array<{ parent_product_id: string; quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        return this.productMovementService.createReturnRequest(req.user.id, data);
    }

    @Get()
    findAll(@Request() req, @Query('type') type?: string): Promise<ProductMovementRequest[]> {
        return this.productMovementService.findAll(req.user, type);
    }

    @Put(':id/accept')
    @Roles(UserRole.COURIER, UserRole.ADMIN)
    acceptRequest(
        @Param('id') id: string,
        @Request() req,
        @Body() data: {
            items: Array<{ item_id: string; accepted_quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        return this.productMovementService.acceptRequest(id, req.user.id, data);
    }

    @Put(':id/accept-return')
    @Roles(UserRole.SELLER, UserRole.ADMIN)
    acceptReturn(
        @Param('id') id: string,
        @Request() req,
        @Body() data: {
            items: Array<{ item_id: string; accepted_quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        return this.productMovementService.acceptReturn(id, req.user.id, data);
    }
    @Get('product/:id/inventory')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER)
    getInventorySummary(@Param('id') id: string) {
        return this.productMovementService.getInventorySummary(id);
    }

    @Get('product/:id/movements')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER)
    getMovementHistory(@Param('id') id: string) {
        return this.productMovementService.getMovementHistory(id);
    }

    @Get('movements')
    @Roles(UserRole.ADMIN, UserRole.COURIER)
    async getMovements(
        @Query('product') productSearch?: string,
        @Query('type') movementType?: string,
        @Query('location') locationId?: string,
        @Query('dateFrom') dateFrom?: string,
    ) {
        return this.productMovementService.getMovements({
            productSearch,
            movementType,
            locationId,
            dateFrom,
        });
    }
}
