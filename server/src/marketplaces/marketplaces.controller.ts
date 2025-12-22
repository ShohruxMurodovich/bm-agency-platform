import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { MarketplacesService } from './marketplaces.service';
import { Marketplace } from './marketplace.entity';

@Controller('marketplaces')
export class MarketplacesController {
    constructor(private readonly marketplacesService: MarketplacesService) { }

    @Get()
    findAll(): Promise<Marketplace[]> {
        return this.marketplacesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Marketplace> {
        return this.marketplacesService.findOne(parseInt(id));
    }

    @Post()
    create(@Body() marketplaceData: Partial<Marketplace>): Promise<Marketplace> {
        return this.marketplacesService.create(marketplaceData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() marketplaceData: Partial<Marketplace>): Promise<Marketplace> {
        return this.marketplacesService.update(parseInt(id), marketplaceData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.marketplacesService.remove(parseInt(id));
    }
}
