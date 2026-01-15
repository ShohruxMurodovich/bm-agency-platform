import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { Seller } from '../sellers/seller.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Store, Seller])],
    controllers: [StoresController],
    providers: [StoresService],
})
export class StoresModule { }
