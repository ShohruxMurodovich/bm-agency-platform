import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marketplace } from './marketplace.entity';
import { MarketplacesService } from './marketplaces.service';
import { MarketplacesController } from './marketplaces.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Marketplace])],
    controllers: [MarketplacesController],
    providers: [MarketplacesService],
    exports: [MarketplacesService, TypeOrmModule],
})
export class MarketplacesModule { }
