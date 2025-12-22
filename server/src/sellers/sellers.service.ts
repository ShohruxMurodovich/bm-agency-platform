import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './seller.entity';

@Injectable()
export class SellersService {
    constructor(
        @InjectRepository(Seller)
        private sellersRepository: Repository<Seller>,
    ) { }

    async findAll(): Promise<Seller[]> {
        return this.sellersRepository.find({
            relations: ['user', 'stores'],
        });
    }

    async findOne(id: string): Promise<Seller | null> {
        return this.sellersRepository.findOne({
            where: { id },
            relations: ['user', 'stores'],
        });
    }

    async findByUserId(userId: string): Promise<Seller> {
        return this.sellersRepository.findOne({
            where: { user_id: userId },
            relations: ['user', 'stores'],
        });
    }

    async getStores(sellerId: string): Promise<any[]> {
        const seller = await this.sellersRepository.findOne({
            where: { id: sellerId },
            relations: ['stores', 'stores.marketplace'],
        });
        return seller?.stores || [];
    }

    async create(sellerData: Partial<Seller>): Promise<Seller> {
        const seller = this.sellersRepository.create(sellerData);
        return this.sellersRepository.save(seller);
    }

    async update(id: string, sellerData: Partial<Seller>): Promise<Seller> {
        await this.sellersRepository.update(id, sellerData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.sellersRepository.delete(id);
    }
}
