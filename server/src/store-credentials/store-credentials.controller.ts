import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { StoreCredentialsService } from './store-credentials.service';
import { StoreCredential } from './store-credential.entity';

@Controller('store-credentials')
export class StoreCredentialsController {
    constructor(private readonly storeCredentialsService: StoreCredentialsService) { }

    @Get()
    findAll(): Promise<StoreCredential[]> {
        return this.storeCredentialsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<StoreCredential> {
        return this.storeCredentialsService.findOne(id);
    }

    @Post()
    create(@Body() credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
        return this.storeCredentialsService.create(credentialData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
        return this.storeCredentialsService.update(id, credentialData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.storeCredentialsService.remove(id);
    }
}
