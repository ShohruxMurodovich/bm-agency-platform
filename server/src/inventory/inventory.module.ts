import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { LocationsModule } from './locations/locations.module';
import { BusinessStatusModule } from './business-statuses/business-status.module';
import { InventoryAlertsModule } from './alerts/inventory-alerts.module';
import { ProductState } from './stock-snapshots/product-state.entity';
import { ProductStateService } from './stock-snapshots/product-state.service';
import { ProductStateController } from './stock-snapshots/product-state.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Inventory, ProductState]),
        LocationsModule,
        BusinessStatusModule,
        InventoryAlertsModule
    ],
    controllers: [InventoryController, ProductStateController],
    providers: [InventoryService, ProductStateService],
    exports: [InventoryService, ProductStateService, TypeOrmModule, LocationsModule, BusinessStatusModule],
})
export class InventoryModule { }
