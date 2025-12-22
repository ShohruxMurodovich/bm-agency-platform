import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellersModule } from '../sellers/sellers.module';
import { ParentProduct } from './parent-product.entity';
import { ParentProductsService } from './parent-products.service';
import { ParentProductsController } from './parent-products.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ParentProduct]), SellersModule],
    controllers: [ParentProductsController],
    providers: [ParentProductsService],
    exports: [ParentProductsService, TypeOrmModule],
})
export class ParentProductsModule { }
