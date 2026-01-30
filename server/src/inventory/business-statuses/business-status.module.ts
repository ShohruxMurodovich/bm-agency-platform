import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessStatusService } from './business-status.service';
import { BusinessStatus } from './business-status.entity';
import { BusinessStatusController } from './business-status.controller';

@Module({
    imports: [TypeOrmModule.forFeature([BusinessStatus])],
    controllers: [BusinessStatusController],
    providers: [BusinessStatusService],
    exports: [BusinessStatusService, TypeOrmModule], // Export TypeOrmModule for repository access
})
export class BusinessStatusModule { }
