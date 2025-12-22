import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { ProductMovementRequest } from '../product-movement/product-movement-request.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            ProductMovementRequest,
            ParentProduct,
            Seller,
            User
        ])
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
