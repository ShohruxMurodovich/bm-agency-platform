import {
    Controller, Get, Post, Body, Param, Patch, Delete,
    UseGuards, Request, Query, BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { isRateLimited } from '../common/rate-limiter.util';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    // ── List ──────────────────────────────────────────────────────────────
    @Get()
    async findAll(@Request() req: any) {
        return this.storesService.findAll(req.user);
    }

    @Get('my-stores')
    async getMyStores(@Request() req: any) {
        const sellerId = req.user.seller_id;
        if (!sellerId && req.user.role === 'public_user') {
            throw new BadRequestException('Seller ID not found for public user');
        }
        return this.storesService.findBySellerId(sellerId);
    }

    @Get(':id/marketplace-products')
    async getMarketplaceProducts(
        @Param('id') id: string,
        @Query('search') search?: string,
    ) {
        return this.storesService.getMarketplaceProducts(id, search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.storesService.findOne(id);
    }

    // ── Validate (dry-run, rate-limited 10/min) ───────────────────────────
    @Post('validate')
    @HttpCode(HttpStatus.OK)
    async validate(
        @Body() body: { marketplace: string; external_shop_id: string; token: string },
        @Request() req: any,
    ) {
        const key = `${req.user.userId}:validate`;
        if (isRateLimited(key, 10, 60_000)) {
            throw new BadRequestException('Too many validation requests. Please wait a minute and try again.');
        }
        if (!body.marketplace || !body.external_shop_id || !body.token) {
            throw new BadRequestException('marketplace, external_shop_id and token are required');
        }
        return this.storesService.validate(body);
    }

    // ── Uzum Token (rate-limited 10/min) ──────────────────────────────────
    @Post('uzum-token')
    @HttpCode(HttpStatus.OK)
    async getUzumToken(
        @Body() body: { email: string; password: string },
        @Request() req: any,
    ) {
        const key = `${req.user.userId}:uzum-token`;
        if (isRateLimited(key, 10, 60_000)) {
            throw new BadRequestException('Too many requests. Please wait a minute and try again.');
        }
        if (!body.email || !body.password) {
            throw new BadRequestException('email and password are required');
        }
        return this.storesService.getUzumToken(body.email, body.password);
    }

    // ── Create ────────────────────────────────────────────────────────────
    @Post()
    async create(@Body() body: any, @Request() req: any) {
        if (!body.marketplace || !body.external_shop_id || !body.token) {
            throw new BadRequestException('marketplace, external_shop_id and token are required');
        }
        return this.storesService.create(body, req.user);
    }

    // ── Update token ──────────────────────────────────────────────────────
    @Patch(':id/token')
    async updateToken(
        @Param('id') id: string,
        @Body() body: { token: string; marketplace?: string },
        @Request() req: any,
    ) {
        if (!body.token) throw new BadRequestException('token is required');
        return this.storesService.updateToken(id, body.token, req.user);
    }

    // ── Update display name ───────────────────────────────────────────────
    @Patch(':id/display-name')
    async updateDisplayName(
        @Param('id') id: string,
        @Body() body: { display_name: string },
        @Request() req: any,
    ) {
        return this.storesService.updateDisplayName(id, body.display_name, req.user);
    }

    // ── Disable / Enable ─────────────────────────────────────────────────
    @Patch(':id/disable')
    async disable(@Param('id') id: string, @Request() req: any) {
        return this.storesService.disable(id, req.user);
    }

    @Patch(':id/enable')
    async enable(@Param('id') id: string, @Request() req: any) {
        return this.storesService.enable(id, req.user);
    }

    // ── Soft Delete (Admin only) ──────────────────────────────────────────
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string) {
        await this.storesService.softDelete(id);
        return { success: true };
    }
}
