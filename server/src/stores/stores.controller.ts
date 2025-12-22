import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { StoresService } from './stores.service';
import { Store } from './store.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('stores')
@UseGuards(AuthGuard('jwt'))
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.storesService.findAll(req.user);
    }

    @Get(':id/marketplace-products')
    async getMarketplaceProducts(
        @Param('id') id: string,
        @Query('search') search?: string
    ) {
        return this.storesService.getMarketplaceProducts(id, search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.storesService.findOne(id);
    }

    @Post()
    async create(@Body() storeData: Partial<Store>, @Request() req: any) {
        return this.storesService.create(storeData, req.user);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() storeData: Partial<Store>) {
        return this.storesService.update(id, storeData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.storesService.remove(id);
    }
}
