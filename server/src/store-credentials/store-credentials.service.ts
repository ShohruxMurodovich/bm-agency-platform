import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreCredential } from './store-credential.entity';

@Injectable()
export class StoreCredentialsService {
    constructor(
        @InjectRepository(StoreCredential)
        private storeCredentialsRepository: Repository<StoreCredential>,
    ) { }

    async findAll(): Promise<StoreCredential[]> {
        return this.storeCredentialsRepository.find({
            relations: ['store'],
        });
    }

    async findOne(id: string): Promise<StoreCredential | null> {
        return this.storeCredentialsRepository.findOne({
            where: { id },
            relations: ['store'],
        });
    }

    async findByStore(storeId: string): Promise<StoreCredential[]> {
        return this.storeCredentialsRepository.find({
            where: { store_id: storeId },
        });
    }

    async findActiveByStore(storeId: string): Promise<StoreCredential> {
        return this.storeCredentialsRepository.findOne({
            where: { store_id: storeId, is_active: true },
        });
    }

    async create(credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
        const credential = this.storeCredentialsRepository.create(credentialData);
        return this.storeCredentialsRepository.save(credential);
    }

    async update(id: string, credentialData: Partial<StoreCredential>): Promise<StoreCredential> {
        await this.storeCredentialsRepository.update(id, credentialData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.storeCredentialsRepository.delete(id);
    }
}
