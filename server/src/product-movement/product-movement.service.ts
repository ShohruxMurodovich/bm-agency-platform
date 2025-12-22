import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductMovementRequest } from './product-movement-request.entity';
import { ProductMovementItem } from './product-movement-item.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ProductMovementService {
    constructor(
        @InjectRepository(ProductMovementRequest)
        private requestsRepo: Repository<ProductMovementRequest>,
        @InjectRepository(ProductMovementItem)
        private itemsRepo: Repository<ProductMovementItem>,
        @InjectRepository(ParentProduct)
        private parentProductsRepo: Repository<ParentProduct>,
        @InjectRepository(Seller)
        private sellersRepo: Repository<Seller>,
    ) { }

    async createSendRequest(
        userId: string,
        data: {
            products: Array<{ parent_product_id: string; quantity: number }>;
            notes?: string;
            seller_id?: string; // Optional for admin
        }
    ): Promise<ProductMovementRequest> {
        // Get seller from user (or use provided seller_id for admin)
        const seller = await this.sellersRepo.findOne({ where: { user_id: userId } });

        let sellerId: string;
        if (seller) {
            sellerId = seller.id;
        } else if (data.seller_id) {
            // Admin can specify seller_id
            sellerId = data.seller_id;
        } else {
            throw new ForbiddenException('Only sellers can create send requests or admin must specify seller_id');
        }

        // Verify ownership of all products
        await this.verifyProductOwnership(sellerId, data.products.map(p => p.parent_product_id));

        // Create request
        const request = this.requestsRepo.create({
            type: 'send',
            seller_id: sellerId,
            created_by: userId,
            notes: data.notes,
            status: 'pending',
        });

        // Create items
        const items = data.products.map(p =>
            this.itemsRepo.create({
                parent_product_id: p.parent_product_id,
                requested_quantity: p.quantity,
                status: 'pending',
            })
        );

        request.items = items;
        return this.requestsRepo.save(request);
    }

    async createReturnRequest(
        userId: string,
        data: {
            seller_id: string;
            products: Array<{ parent_product_id: string; quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        // Verify all products belong to the seller
        await this.verifyProductOwnership(data.seller_id, data.products.map(p => p.parent_product_id));

        // Create request
        const request = this.requestsRepo.create({
            type: 'return',
            seller_id: data.seller_id,
            created_by: userId,
            notes: data.notes,
            status: 'pending',
        });

        // Create items
        const items = data.products.map(p =>
            this.itemsRepo.create({
                parent_product_id: p.parent_product_id,
                requested_quantity: p.quantity,
                status: 'pending',
            })
        );

        request.items = items;
        return this.requestsRepo.save(request);
    }

    async acceptRequest(
        requestId: string,
        courierId: string,
        data: {
            items: Array<{ item_id: string; accepted_quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        const request = await this.requestsRepo.findOne({
            where: { id: requestId },
            relations: ['items', 'items.parent_product'],
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Request already processed');
        }

        if (request.type !== 'send') {
            throw new BadRequestException('Only send requests can be accepted by courier');
        }

        // Update items
        for (const itemData of data.items) {
            const item = request.items.find(i => i.id === itemData.item_id);
            if (!item) continue;

            item.accepted_quantity = itemData.accepted_quantity;
            if (item.accepted_quantity === item.requested_quantity) {
                item.status = 'accepted';
            } else if (item.accepted_quantity > 0) {
                item.status = 'partially_accepted';
            } else {
                item.status = 'rejected';
            }
        }

        // Calculate overall status
        const allAccepted = request.items.every(i => i.status === 'accepted');
        const anyPartial = request.items.some(i => i.status === 'partially_accepted');

        request.status = allAccepted ? 'accepted' : (anyPartial ? 'partially_accepted' : 'rejected');
        request.courier_id = courierId;
        request.accepted_by = courierId;
        request.accepted_at = new Date();
        if (data.notes) {
            request.notes = (request.notes || '') + '\n' + data.notes;
        }

        return this.requestsRepo.save(request);
    }

    async acceptReturn(
        requestId: string,
        userId: string,
        data: {
            items: Array<{ item_id: string; accepted_quantity: number }>;
            notes?: string;
        }
    ): Promise<ProductMovementRequest> {
        const request = await this.requestsRepo.findOne({
            where: { id: requestId },
            relations: ['items', 'items.parent_product', 'seller'],
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        // Only check ownership if not admin
        const user = await this.sellersRepo.manager.findOne(User, { where: { id: userId } });
        if (user?.role !== 'admin') {
            const seller = await this.sellersRepo.findOne({ where: { user_id: userId } });
            if (!seller || request.seller_id !== seller.id) {
                throw new ForbiddenException('You can only accept returns for your own products');
            }
        }

        if (request.status !== 'pending') {
            throw new BadRequestException('Request already processed');
        }

        if (request.type !== 'return') {
            throw new BadRequestException('Only return requests can be accepted by seller');
        }

        // Update items (same logic as acceptRequest)
        for (const itemData of data.items) {
            const item = request.items.find(i => i.id === itemData.item_id);
            if (!item) continue;

            item.accepted_quantity = itemData.accepted_quantity;
            if (item.accepted_quantity === item.requested_quantity) {
                item.status = 'accepted';
            } else if (item.accepted_quantity > 0) {
                item.status = 'partially_accepted';
            } else {
                item.status = 'rejected';
            }
        }

        // Calculate overall status
        const allAccepted = request.items.every(i => i.status === 'accepted');
        const anyPartial = request.items.some(i => i.status === 'partially_accepted');

        request.status = allAccepted ? 'accepted' : (anyPartial ? 'partially_accepted' : 'rejected');
        request.accepted_by = userId;
        request.accepted_at = new Date();
        if (data.notes) {
            request.notes = (request.notes || '') + '\n' + data.notes;
        }

        return this.requestsRepo.save(request);
    }

    async findAll(user: any, type?: string): Promise<ProductMovementRequest[]> {
        const query = this.requestsRepo.createQueryBuilder('request')
            .leftJoinAndSelect('request.items', 'items')
            .leftJoinAndSelect('items.parent_product', 'product')
            .leftJoinAndSelect('request.seller', 'seller')
            .leftJoinAndSelect('request.courier', 'courier');

        // Role-based filtering
        if (user.role === 'seller') {
            const seller = await this.sellersRepo.findOne({ where: { user_id: user.id } });
            if (seller) {
                query.where('request.seller_id = :sellerId', { sellerId: seller.id });
            }
        } else if (user.role === 'courier') {
            query.where('request.status = :status OR request.courier_id = :courierId', {
                status: 'pending',
                courierId: user.id
            });
        }
        // Admin sees all

        if (type) {
            query.andWhere('request.type = :type', { type });
        }

        return query.orderBy('request.created_at', 'DESC').getMany();
    }

    private async verifyProductOwnership(sellerId: string, productIds: string[]): Promise<void> {
        const products = await this.parentProductsRepo.find({
            where: {
                id: In(productIds),
            }
        });

        if (products.length !== productIds.length) {
            throw new ForbiddenException('Some products do not exist');
        }

        // Check that all products belong to the seller
        const allBelongToSeller = products.every(p => p.seller_id === sellerId);
        if (!allBelongToSeller) {
            throw new ForbiddenException('You can only work with products that belong to the specified seller');
        }
    }
}
