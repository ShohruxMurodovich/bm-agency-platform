import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentProduct } from './parent-product.entity';

@Injectable()
export class ParentProductsService {
    constructor(
        @InjectRepository(ParentProduct)
        private parentProductsRepository: Repository<ParentProduct>,
    ) { }

    async findAll(search?: string, sellerId?: string): Promise<ParentProduct[]> {
        const query = this.parentProductsRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.seller', 'seller');

        if (search) {
            query.where('product.product_name LIKE :search OR product.description LIKE :search', {
                search: `%${search}%`,
            });
        }

        if (sellerId) {
            if (search) {
                query.andWhere('product.seller_id = :sellerId', { sellerId });
            } else {
                query.where('product.seller_id = :sellerId', { sellerId });
            }
        }

        return query.getMany();
    }

    async findOne(id: string): Promise<ParentProduct | null> {
        return this.parentProductsRepository.findOne({
            where: { id },
            relations: ['seller'],
        });
    }

    async findBySeller(sellerId: string): Promise<ParentProduct[]> {
        return this.parentProductsRepository.find({
            where: { seller_id: sellerId },
            relations: ['seller'],
        });
    }

    async create(productData: Partial<ParentProduct>): Promise<ParentProduct> {
        const product = this.parentProductsRepository.create(productData);
        return this.parentProductsRepository.save(product);
    }

    async update(id: string, productData: Partial<ParentProduct>): Promise<ParentProduct> {
        await this.parentProductsRepository.update(id, productData);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.parentProductsRepository.delete(id);
    }
}
