import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMovementController } from './product-movement.controller';
import { ProductMovementService } from './product-movement.service';
import { ProductTrackingController } from './product-tracking.controller';
import { ProductTrackingService } from './product-tracking.service';
import { ProductMovementRequest } from './product-movement-request.entity';
import { ProductMovementItem } from './product-movement-item.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';
import { ProductMovement } from './product-movement.entity';
import { MovementOrderMapping } from './movement-order-mapping.entity';
import { MovementOrderAuditLog } from './movement-order-audit-log.entity';
import { ProductState } from '../inventory/stock-snapshots/product-state.entity';
import { LocationsModule } from '../inventory/locations/locations.module';
import { BusinessStatusModule } from '../inventory/business-statuses/business-status.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductMovementRequest,
            ProductMovementItem,
            ParentProduct,
            Seller,
            ProductMovement,
            MovementOrderMapping,
            MovementOrderAuditLog,
            ProductState
        ]),
        LocationsModule,
        BusinessStatusModule
    ],
    controllers: [ProductMovementController, ProductTrackingController],
    providers: [ProductMovementService, ProductTrackingService],
    exports: [ProductMovementService, ProductTrackingService],
})
export class ProductMovementModule { }
