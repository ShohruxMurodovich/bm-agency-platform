import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { Store } from './store.entity';
import { AuthGuard } from '@nestjs/passport';
import { TenantId } from '../auth/tenant.decorator';

@Controller('stores')
@UseGuards(AuthGuard('jwt'))
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.storesService.findAll(req.user);
    }

    /**
     * GET /stores/my-stores
     * Returns only the authenticated user's stores (tenant-filtered).
     * For PUBLIC_USER: filtered by seller_id from JWT.
     */
    @Get('my-stores')
    async getMyStores(@TenantId() sellerId: string, @Request() req: any) {
        if (!sellerId && req.user.role === 'public_user') {
            throw new BadRequestException('Seller ID not found for public user');
        }
        return this.storesService.findBySellerId(sellerId || req.user.seller_id);
    }

    @Get(':id/marketplace-products')
    async getMarketplaceProducts(
        @Param('id') id: string,
        @Query('search') search?: string
    ) {
        return this.storesService.getMarketplaceProducts(id, search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.storesService.findOne(id);
    }

    /**
     * POST /stores
     * Create a new store with:
     * - Store limit check (based on seller's max_stores)
     * - Marketplace connection test (via MockMarketplaceClient)
     * - Returns error with upgrade message if limit exceeded
     */
    @Post()
    async create(@Body() storeData: Partial<Store>, @Request() req: any, @TenantId() sellerId: string) {
        return this.storesService.create(storeData, req.user, sellerId);
    }

    /**
     * PATCH /stores/:id/credentials
     * Update store credentials (API token, etc.) for store owner.
     * Re-tests connection after credential update.
     */
    @Patch(':id/credentials')
    async updateCredentials(
        @Param('id') id: string,
        @Body() credentials: { api_token?: string; email?: string; password?: string },
        @Request() req: any
    ) {
        return this.storesService.updateCredentials(id, credentials, req.user);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() storeData: Partial<Store>) {
        return this.storesService.update(id, storeData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.storesService.remove(id);
    }
}
