import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncLog } from './sync-log.entity';
import { SyncLogsService } from './sync-logs.service';
import { SyncLogsController } from './sync-logs.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SyncLog])],
    controllers: [SyncLogsController],
    providers: [SyncLogsService],
    exports: [SyncLogsService, TypeOrmModule],
})
export class SyncLogsModule { }
