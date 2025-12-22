import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductMappingService } from './product-mapping.service';
import { ProductMapping } from './product-mapping.entity';

@Controller('product-mapping')
export class ProductMappingController {
    constructor(private readonly productMappingService: ProductMappingService) { }

    @Get()
    findAll(): Promise<ProductMapping[]> {
        return this.productMappingService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ProductMapping> {
        return this.productMappingService.findOne(id);
    }

    @Post()
    create(@Body() mappingData: Partial<ProductMapping>): Promise<ProductMapping> {
        return this.productMappingService.create(mappingData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() mappingData: Partial<ProductMapping>): Promise<ProductMapping> {
        return this.productMappingService.update(id, mappingData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.productMappingService.remove(id);
    }
}
