import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMapping } from './product-mapping.entity';
import { ProductMappingService } from './product-mapping.service';
import { ProductMappingController } from './product-mapping.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ProductMapping])],
    controllers: [ProductMappingController],
    providers: [ProductMappingService],
    exports: [ProductMappingService, TypeOrmModule],
})
export class ProductMappingModule { }
