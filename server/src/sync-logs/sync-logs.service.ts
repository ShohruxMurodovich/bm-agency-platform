import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './sync-log.entity';

@Injectable()
export class SyncLogsService {
    constructor(
        @InjectRepository(SyncLog)
        private syncLogsRepository: Repository<SyncLog>,
    ) { }

    async findAll(): Promise<SyncLog[]> {
        return this.syncLogsRepository.find({
            relations: ['seller', 'marketplace'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<SyncLog | null> {
        return this.syncLogsRepository.findOne({
            where: { id },
            relations: ['seller', 'marketplace'],
        });
    }

    async findBySeller(sellerId: string): Promise<SyncLog[]> {
        return this.syncLogsRepository.find({
            where: { seller_id: sellerId },
            relations: ['marketplace'],
            order: { created_at: 'DESC' },
        });
    }

    async create(logData: Partial<SyncLog>): Promise<SyncLog> {
        const log = this.syncLogsRepository.create(logData);
        return this.syncLogsRepository.save(log);
    }

    async remove(id: string): Promise<void> {
        await this.syncLogsRepository.delete(id);
    }
}
