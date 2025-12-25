import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessStatus, StatusType } from './business-status.entity';

@Injectable()
export class BusinessStatusService implements OnModuleInit {
    constructor(
        @InjectRepository(BusinessStatus)
        private repo: Repository<BusinessStatus>,
    ) { }

    async onModuleInit() {
        await this.ensureStatus(StatusType.FREE, 'Item is available in stock', false, false);
        await this.ensureStatus(StatusType.READY_FOR_SHIPMENT, 'Item packed and ready to ship', false, false);
        await this.ensureStatus(StatusType.SENT, 'Item sent to marketplace', false, false);
        await this.ensureStatus(StatusType.PAID, 'Item sold and paid', true, true);
        await this.ensureStatus(StatusType.RETURN_REQUESTED, 'Customer requested return', false, false);
        await this.ensureStatus(StatusType.RETURN_RECEIVED, 'Return reached BM warehouse', false, false);
        await this.ensureStatus(StatusType.RETURNED_TO_SELLER, 'Return sent back to seller', true, true);
        await this.ensureStatus(StatusType.DAMAGED, 'Item is damaged', false, true);
        await this.ensureStatus(StatusType.LOST, 'Item is lost', true, true);
        await this.ensureStatus(StatusType.UNKNOWN, 'Status unknown', false, true);
    }

    async ensureStatus(code: string, description: string, isFinal: boolean, blocksOperations: boolean) {
        let status = await this.repo.findOne({ where: { code } });
        if (!status) {
            status = this.repo.create({
                code,
                description,
                is_final: isFinal,
                blocks_operations: blocksOperations
            });
            await this.repo.save(status);
        }
    }

    async findOne(code: string): Promise<BusinessStatus> {
        return this.repo.findOne({ where: { code } });
    }

    async findAll(): Promise<BusinessStatus[]> {
        return this.repo.find({ order: { code: 'ASC' } });
    }
}
