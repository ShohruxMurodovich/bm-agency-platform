import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryAlertsService } from './inventory-alerts.service';
import { ProductState } from '../stock-snapshots/product-state.entity';
import { ProductMovementModule } from '../../product-movement/product-movement.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductState]),
        ProductMovementModule,
        LocationsModule
    ],
    providers: [InventoryAlertsService],
    exports: [InventoryAlertsService]
})
export class InventoryAlertsModule { }
