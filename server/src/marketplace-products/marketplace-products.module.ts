import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceProduct } from './marketplace-product.entity';
import { MarketplaceProductsService } from './marketplace-products.service';
import { MarketplaceProductsController } from './marketplace-products.controller';
import { Category } from '../categories/category.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';

@Module({
    imports: [TypeOrmModule.forFeature([MarketplaceProduct, Category, ParentProduct, ProductMapping])],
    controllers: [MarketplaceProductsController],
    providers: [MarketplaceProductsService],
    exports: [MarketplaceProductsService, TypeOrmModule],
})
export class MarketplaceProductsModule { }
