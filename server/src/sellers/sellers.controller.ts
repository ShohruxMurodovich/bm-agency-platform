import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Seller } from './seller.entity';

@Controller('sellers')
export class SellersController {
    constructor(private readonly sellersService: SellersService) { }

    @Get()
    findAll(): Promise<Seller[]> {
        return this.sellersService.findAll();
    }

    @Get(':id/stores')
    getStores(@Param('id') id: string): Promise<any[]> {
        return this.sellersService.getStores(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Seller> {
        return this.sellersService.findOne(id);
    }

    @Post()
    create(@Body() sellerData: Partial<Seller>): Promise<Seller> {
        return this.sellersService.create(sellerData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() sellerData: Partial<Seller>): Promise<Seller> {
        return this.sellersService.update(id, sellerData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.sellersService.remove(id);
    }
}
