import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParentProductsService } from './parent-products.service';
import { SellersService } from '../sellers/sellers.service';
import { ParentProduct } from './parent-product.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('parent-products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ParentProductsController {
    constructor(
        private readonly parentProductsService: ParentProductsService,
        private readonly sellersService: SellersService
    ) { }

    @Get()
    async findAll(@Request() req: any, @Query('search') search?: string, @Query('seller_id') sellerId?: string) {
        let filterSellerId = sellerId;

        // RBAC: If user is a seller, force filtering by their own seller ID
        if (req.user.role === UserRole.SELLER) {
            const seller = await this.sellersService.findByUserId(req.user.id);
            if (seller) {
                filterSellerId = seller.id;
            } else {
                // Should not happen if data integrity is good, but if no seller profile, return empty
                return [];
            }
        }

        return this.parentProductsService.findAll(search, filterSellerId);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ParentProduct> {
        return this.parentProductsService.findOne(id);
    }

    @Post()
    create(@Body() productData: Partial<ParentProduct>): Promise<ParentProduct> {
        return this.parentProductsService.create(productData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() productData: Partial<ParentProduct>): Promise<ParentProduct> {
        return this.parentProductsService.update(id, productData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.parentProductsService.remove(id);
    }
}
