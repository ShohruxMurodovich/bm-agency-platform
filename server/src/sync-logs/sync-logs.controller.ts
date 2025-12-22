import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SyncLogsService } from './sync-logs.service';
import { SyncLog } from './sync-log.entity';

@Controller('sync-logs')
export class SyncLogsController {
    constructor(private readonly syncLogsService: SyncLogsService) { }

    @Get()
    findAll(): Promise<SyncLog[]> {
        return this.syncLogsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<SyncLog> {
        return this.syncLogsService.findOne(id);
    }

    @Post()
    create(@Body() logData: Partial<SyncLog>): Promise<SyncLog> {
        return this.syncLogsService.create(logData);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.syncLogsService.remove(id);
    }
}
