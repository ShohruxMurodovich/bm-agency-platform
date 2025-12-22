import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './system-log.entity';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemLog)
        private logsRepository: Repository<SystemLog>,
    ) { }

    async getStatus(): Promise<any> {
        return { status: 'ok', time: new Date() };
    }

    async getLogs(): Promise<SystemLog[]> {
        return this.logsRepository.find({ order: { created_at: 'DESC' }, take: 100 });
    }

    async createLog(type: string, message: string, metadata?: any): Promise<SystemLog> {
        const log = this.logsRepository.create({
            type,
            message,
            metadata
        });
        return this.logsRepository.save(log);
    }
}
