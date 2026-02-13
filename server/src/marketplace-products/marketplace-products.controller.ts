import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MarketplaceProductsService } from './marketplace-products.service';
import { MarketplaceProduct } from './marketplace-product.entity';
import { ProfitFiltersDto, ProfitAnalysisResponseDto, MarketplaceProductVariantDto } from './dto/marketplace-profit.dto';

@Controller('marketplace-products')
export class MarketplaceProductsController {
    constructor(private readonly marketplaceProductsService: MarketplaceProductsService) { }

    @Get()
    findAll(): Promise<MarketplaceProduct[]> {
        return this.marketplaceProductsService.findAll();
    }

    @Get('profit-analysis')
    async getProfitAnalysis(
        @Query() filters: ProfitFiltersDto,
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 20,
        @Req() req: any,
    ): Promise<ProfitAnalysisResponseDto> {
        // TODO: Get sellerId from authenticated user
        const sellerId = req.user?.seller_id || 'temp-seller-id';
        return this.marketplaceProductsService.findWithProfitAnalysis(
            filters,
            sellerId,
            page,
            perPage,
        );
    }

    @Get('profit-analysis/:product_id/variants')
    async getProductVariants(
        @Param('product_id') productId: number,
        @Query() filters: ProfitFiltersDto,
        @Req() req: any,
    ): Promise<MarketplaceProductVariantDto[]> {
        return this.marketplaceProductsService.getVariantsForProductId(
            productId,
            filters,
        );
    }

    @Get('profit-analysis/export')
    async exportExcel(
        @Query() filters: ProfitFiltersDto,
        @Req() req: any,
        @Res() res: Response,
    ): Promise<void> {
        const sellerId = req.user?.seller_id || 'temp-seller-id';
        const buffer = await this.marketplaceProductsService.exportToExcel(filters, sellerId);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=marketplace-products-profit-${Date.now()}.xlsx`,
            'Content-Length': buffer.length,
        });

        res.send(buffer);
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
