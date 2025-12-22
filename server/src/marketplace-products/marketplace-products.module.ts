import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceProduct } from './marketplace-product.entity';
import { MarketplaceProductsService } from './marketplace-products.service';
import { MarketplaceProductsController } from './marketplace-products.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MarketplaceProduct])],
    controllers: [MarketplaceProductsController],
    providers: [MarketplaceProductsService],
    exports: [MarketplaceProductsService, TypeOrmModule],
})
export class MarketplaceProductsModule { }
