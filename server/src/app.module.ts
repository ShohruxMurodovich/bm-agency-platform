import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { SellersModule } from './sellers/sellers.module';
import { MarketplacesModule } from './marketplaces/marketplaces.module';
import { StoresModule } from './stores/stores.module';
import { StoreCredentialsModule } from './store-credentials/store-credentials.module';
import { ParentProductsModule } from './parent-products/parent-products.module';
import { MarketplaceProductsModule } from './marketplace-products/marketplace-products.module';
import { ProductMappingModule } from './product-mapping/product-mapping.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { SyncLogsModule } from './sync-logs/sync-logs.module';
import { SystemModule } from './system/system.module';
import { AuthModule } from './auth/auth.module';
import { ProductMovementModule } from './product-movement/product-movement.module';
import { LoggingInterceptor } from './system/logging.interceptor';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'platform_db',
      autoLoadEntities: true,
      synchronize: true, // TODO: set false in production
    }),
    UsersModule,
    SellersModule,
    MarketplacesModule,
    StoresModule,
    StoreCredentialsModule,
    ParentProductsModule,
    MarketplaceProductsModule,
    ProductMappingModule,
    InventoryModule,
    OrdersModule,
    OrderItemsModule,
    SyncLogsModule,
    SystemModule,
    AuthModule,
    ProductMovementModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
