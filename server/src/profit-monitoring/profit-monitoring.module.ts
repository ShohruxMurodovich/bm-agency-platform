import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfitMonitoring } from './profit-monitoring.entity';
import { ProfitMonitoringService } from './profit-monitoring.service';
import { ProfitMonitoringController } from './profit-monitoring.controller';
import { SellersModule } from '../sellers/sellers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProfitMonitoring]),
        SellersModule,
    ],
    providers: [ProfitMonitoringService],
    controllers: [ProfitMonitoringController],
})
export class ProfitMonitoringModule { }
