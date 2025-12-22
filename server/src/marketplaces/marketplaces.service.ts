import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marketplace } from './marketplace.entity';

@Injectable()
export class MarketplacesService {
    constructor(
        @InjectRepository(Marketplace)
        private marketplacesRepository: Repository<Marketplace>,
    ) { }

    async findAll(): Promise<Marketplace[]> {
        return this.marketplacesRepository.find();
    }

    async findOne(id: number): Promise<Marketplace | null> {
        return this.marketplacesRepository.findOne({
            where: { id },
        });
    }

    async create(marketplaceData: Partial<Marketplace>): Promise<Marketplace> {
        const marketplace = this.marketplacesRepository.create(marketplaceData);
        return this.marketplacesRepository.save(marketplace);
    }

    async update(id: number, marketplaceData: Partial<Marketplace>): Promise<Marketplace> {
        await this.marketplacesRepository.update(id, marketplaceData);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.marketplacesRepository.delete(id);
    }
}
