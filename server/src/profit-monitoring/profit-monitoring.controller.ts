import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfitMonitoringService } from './profit-monitoring.service';
import { SellersService } from '../sellers/sellers.service';
import type { ProfitMonitoringQuery } from './profit-monitoring.service';

@UseGuards(JwtAuthGuard)
@Controller('profit-monitoring')
export class ProfitMonitoringController {
    constructor(
        private readonly service: ProfitMonitoringService,
        private readonly sellersService: SellersService,
    ) { }

    /**
     * Resolve seller_id for non-admin users.
     * Admin/Staff → null (sees everything)
     * Seller/Public → their seller_id (sees only their data)
     */
    private async resolveSellerId(user: any): Promise<string | undefined> {
        if (user.role === 'admin' || user.role === 'staff') {
            return undefined; // No filter — see all
        }
        // Seller or public_user: find their seller_id
        let sellerId = user.seller_id;
        if (!sellerId) {
            const seller = await this.sellersService.findByUserId(user.userId);
            sellerId = seller?.id;
        }
        return sellerId;
    }

    @Get()
    async findAll(@Query() query: ProfitMonitoringQuery, @Request() req: any) {
        const sellerId = await this.resolveSellerId(req.user);
        return this.service.findAll(query, sellerId);
    }

    @Get('summary')
    async getSummary(@Request() req: any) {
        const sellerId = await this.resolveSellerId(req.user);
        return this.service.getSummary(sellerId);
    }
}
