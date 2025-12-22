import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MarketplaceProductsService } from './marketplace-products.service';
import { MarketplaceProduct } from './marketplace-product.entity';

@Controller('marketplace-products')
export class MarketplaceProductsController {
    constructor(private readonly marketplaceProductsService: MarketplaceProductsService) { }

    @Get()
    findAll(): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<MarketplaceProduct> {
        return this.marketplaceProductsService.findOne(id);
    }

    @Post()
    create(@Body() productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        return this.marketplaceProductsService.create(productData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() productData: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> {
        return this.marketplaceProductsService.update(id, productData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.marketplaceProductsService.remove(id);
    }
}
