import {
    Controller,
    Get,
    Patch,
    Query,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ProductTrackingService } from './product-tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { MovementType } from './product-movement.entity';

// DTOs
class GetOrdersListDto {
    search?: string;
    dateFrom?: string; // Will be parsed to Date
    dateTo?: string;
    movementType?: MovementType;
    locationId?: string;
    marketplace?: string;
    limit?: number;
    offset?: number;
}

class AssignOrderNumberDto {
    order_number: string;
    comment?: string;
}

@Controller('product-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductTrackingController {
    constructor(private readonly productTrackingService: ProductTrackingService) { }

    /**
     * GET /product-tracking/orders
     * Orders list (TAB 1 - Level 1)
     * Roles: ADMIN, STAFF, SELLER, PUBLIC_USER
     */
    @Get('orders')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async getOrdersList(@Request() req, @Query() query: GetOrdersListDto) {
        const filters = {
            search: query.search,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            movementType: query.movementType,
            locationId: query.locationId,
            marketplace: query.marketplace,
            limit: query.limit ? parseInt(query.limit as any, 10) : 20,
            offset: query.offset ? parseInt(query.offset as any, 10) : 0,
        };

        return await this.productTrackingService.getOrdersList(filters);
    }

    /**
     * GET /product-tracking/orders/:orderNumber/products
     * Products within an order (ТАВ 1 - Level 2)
     * Roles: ADMIN, STAFF, SELLER, PUBLIC_USER
     */
    @Get('orders/:orderNumber/products')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async getOrderProducts(@Request() req, @Param('orderNumber') orderNumber: string) {
        return await this.productTrackingService.getOrderProducts(orderNumber);
    }

    /**
     * GET /product-tracking/orders/:orderNumber/products/:productId/movements
     * Movement details for a product in an order (TAB 1 - Level 3)
     * Roles: ADMIN, STAFF, SELLER, PUBLIC_USER
     */
    @Get('orders/:orderNumber/products/:productId/movements')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async getOrderProductMovements(
        @Request() req,
        @Param('orderNumber') orderNumber: string,
        @Param('productId') productId: string
    ) {
        return await this.productTrackingService.getOrderProductMovements(
            orderNumber,
            productId
        );
    }

    /**
     * GET /product-tracking/unassigned
     * Get movements without order_number (TAB 2)
     * Roles: ADMIN, STAFF, SELLER, PUBLIC_USER
     */
    @Get('unassigned')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async getUnassignedMovements(@Request() req, @Query() query: GetOrdersListDto) {
        const filters = {
            search: query.search,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            movementType: query.movementType,
            locationId: query.locationId,
            limit: query.limit ? parseInt(query.limit as any, 10) : 20,
            offset: query.offset ? parseInt(query.offset as any, 10) : 0,
        };

        return await this.productTrackingService.getUnassignedMovements(filters);
    }

    /**
     * PATCH /product-tracking/movements/:movementId/assign-order
     * Manual assignment of order_number
     * Roles: ADMIN, STAFF only (enforced at controller - backend is source of truth)
     */
    @Patch('movements/:movementId/assign-order')
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    async assignOrderNumber(
        @Request() req,
        @Param('movementId') movementId: string,
        @Body() dto: AssignOrderNumberDto
    ) {
        const userId = req.user.id;
        const sellerId = req.user.currentSellerId; // Required for tenant isolation in raw SQL

        return await this.productTrackingService.assignOrderNumber(
            movementId,
            dto.order_number,
            userId,
            sellerId,
            dto.comment
        );
    }

    /**
     * GET /product-tracking/order-suggestions?q=
     * Autocomplete for order_number
     * Roles: ADMIN, STAFF, SELLER, PUBLIC_USER
     */
    @Get('order-suggestions')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async getOrderNumberSuggestions(@Request() req, @Query('q') query: string) {
        const limit = 10;

        return await this.productTrackingService.getOrderNumberSuggestions(
            query || '',
            limit
        );
    }

    /**
     * GET /product-tracking/movements/:movementId/audit
     * Get audit log for a movement's order number assignments
     * Roles: ADMIN, STAFF only
     */
    @Get('movements/:movementId/audit')
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    async getMovementAuditLog(@Request() req, @Param('movementId') movementId: string) {
        return await this.productTrackingService.getMovementAuditLog(movementId);
    }
}
