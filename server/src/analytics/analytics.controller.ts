import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * GET /analytics/overview
     * Returns basic analytics for PUBLIC_USER (tenant-filtered)
     */
    @Get('overview')
    @Roles(UserRole.PUBLIC_USER, UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER)
    async getOverview(@Request() req: any) {
        const sellerId = req.user.seller_id;

        if (!sellerId) {
            return {
                orders: { total: 0, this_month: 0, pending: 0 },
                revenue: { total: 0, this_month: 0, currency: 'USD' },
                inventory: { total_products: 0, total_stock: 0, low_stock_items: 0 }
            };
        }

        return this.analyticsService.getOverview(sellerId);
    }
}
