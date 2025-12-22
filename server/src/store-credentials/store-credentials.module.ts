import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreCredential } from './store-credential.entity';
import { StoreCredentialsService } from './store-credentials.service';
import { StoreCredentialsController } from './store-credentials.controller';

@Module({
    imports: [TypeOrmModule.forFeature([StoreCredential])],
    controllers: [StoreCredentialsController],
    providers: [StoreCredentialsService],
    exports: [StoreCredentialsService, TypeOrmModule],
})
export class StoreCredentialsModule { }
