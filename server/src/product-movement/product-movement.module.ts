import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMovementController } from './product-movement.controller';
import { ProductMovementService } from './product-movement.service';
import { ProductMovementRequest } from './product-movement-request.entity';
import { ProductMovementItem } from './product-movement-item.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductMovementRequest,
            ProductMovementItem,
            ParentProduct,
            Seller,
        ]),
    ],
    controllers: [ProductMovementController],
    providers: [ProductMovementService],
    exports: [ProductMovementService],
})
export class ProductMovementModule { }
