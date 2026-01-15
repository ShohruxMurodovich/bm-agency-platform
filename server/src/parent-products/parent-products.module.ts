import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellersModule } from '../sellers/sellers.module';
import { ParentProduct } from './parent-product.entity';
import { ParentProductsService } from './parent-products.service';
import { ParentProductsController } from './parent-products.controller';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import { ProductMovement } from '../product-movement/product-movement.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ParentProduct, ProductMapping, ProductMovement]),
        SellersModule
    ],
    controllers: [ParentProductsController],
    providers: [ParentProductsService],
    exports: [ParentProductsService, TypeOrmModule],
})
export class ParentProductsModule { }
