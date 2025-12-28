import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './seller.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@Injectable()
export class SellersService {
    constructor(
        @InjectRepository(Seller)
        private sellersRepository: Repository<Seller>,
        private usersService: UsersService,
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

    async create(sellerData: any): Promise<Seller> {
        let userId = sellerData.user_id;

        if (!userId && sellerData.email && sellerData.password) {
            const existingUser = await this.usersService.findOneByEmail(sellerData.email);
            if (existingUser) {
                userId = existingUser.id;
            } else {
                const newUser = await this.usersService.create({
                    email: sellerData.email,
                    password_hash: sellerData.password,
                    name: sellerData.name,
                    role: UserRole.SELLER
                });
                userId = newUser.id;
            }
        }

        const seller = this.sellersRepository.create({
            ...sellerData,
            user_id: userId
        });
        return this.sellersRepository.save(seller) as unknown as Promise<Seller>;
    }

    async update(id: string, sellerData: Partial<Seller>): Promise<Seller> {
        await this.sellersRepository.update(id, sellerData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.sellersRepository.delete(id);
    }
}
