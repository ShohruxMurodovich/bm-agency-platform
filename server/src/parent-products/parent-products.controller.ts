import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Query, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParentProductsService } from './parent-products.service';
import { SellersService } from '../sellers/sellers.service';
import { ParentProduct } from './parent-product.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';
import { TenantId } from '../auth/tenant.decorator';

@Controller('parent-products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentProductsController {
    constructor(
        private readonly parentProductsService: ParentProductsService,
        private readonly sellersService: SellersService
    ) { }

    /**
     * GET /parent-products
     * Returns tenant-filtered products (exclude archived for PUBLIC_USER).
     */
    @Get()
    async findAll(
        @Request() req: any,
        @TenantId() sellerId: string,
        @Query('search') search?: string,
        @Query('seller_id') querySellerId?: string
    ) {
        let filterSellerId = querySellerId;

        // For SELLER/PUBLIC_USER, use their own seller_id from JWT 
        if (req.user.role === UserRole.SELLER || req.user.role === UserRole.PUBLIC_USER) {
            filterSellerId = sellerId || req.user.seller_id;
            if (!filterSellerId) {
                const seller = await this.sellersService.findByUserId(req.user.userId);
                filterSellerId = seller?.id;
            }
        }

        return this.parentProductsService.findAll(search, filterSellerId, req.user.role === UserRole.PUBLIC_USER);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    findOne(@Param('id') id: string): Promise<ParentProduct> {
        return this.parentProductsService.findOne(id);
    }

    /**
     * POST /parent-products
     * Create parent product with validation and duplicate name check.
     */
    @Post()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async create(
        @Body() productData: Partial<ParentProduct>,
        @Request() req: any,
        @TenantId() sellerId: string
    ): Promise<{ product: ParentProduct; warning?: string }> {
        // Validate required fields
        if (!productData.product_name || productData.product_name.trim() === '') {
            throw new BadRequestException('Product name is required');
        }
        if (productData.stock === undefined || productData.stock < 0) {
            throw new BadRequestException('Stock must be a non-negative number');
        }

        // Determine seller_id
        const resolvedSellerId = sellerId || req.user.seller_id || productData.seller_id;
        if (!resolvedSellerId) {
            throw new BadRequestException('Seller ID is required');
        }

        // Check for duplicate name (warning, not error)
        const isDuplicate = await this.parentProductsService.checkDuplicateName(
            resolvedSellerId,
            productData.product_name.trim()
        );

        const product = await this.parentProductsService.create({
            ...productData,
            seller_id: resolvedSellerId,
        });

        return {
            product,
            warning: isDuplicate ? 'A product with this name already exists' : undefined,
        };
    }

    @Put(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    update(@Param('id') id: string, @Body() productData: Partial<ParentProduct>): Promise<ParentProduct> {
        return this.parentProductsService.update(id, productData);
    }

    /**
     * PATCH /parent-products/:id/stock
     * Update stock and sync to all mapped marketplace products.
     * Creates ADJUSTMENT ProductMovement.
     */
    @Patch(':id/stock')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async updateStock(
        @Param('id') id: string,
        @Body() dto: { stock: number },
        @Request() req: any
    ): Promise<{ success: boolean; parent_product: any; sync_results: any[] }> {
        // Validate
        if (dto.stock === undefined || dto.stock < 0) {
            throw new BadRequestException('Stock must be a non-negative number');
        }

        const result = await this.parentProductsService.updateStock(id, dto.stock, req.user);
        return result;
    }

    /**
     * DELETE /parent-products/:id
     * Soft delete via is_archived flag.
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.PUBLIC_USER)
    async remove(@Param('id') id: string, @Request() req: any): Promise<{ success: boolean; message: string }> {
        const result = await this.parentProductsService.softDelete(id, req.user);
        return result;
    }
}
