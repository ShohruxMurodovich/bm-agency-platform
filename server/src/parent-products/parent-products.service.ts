import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentProduct } from './parent-product.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import { ProductMovement, MovementType } from '../product-movement/product-movement.entity';
import { MarketplaceClientFactory } from '../marketplace-integration/marketplace-client.factory';

@Injectable()
export class ParentProductsService {
    constructor(
        @InjectRepository(ParentProduct)
        private parentProductsRepository: Repository<ParentProduct>,
        @InjectRepository(ProductMapping)
        private productMappingRepository: Repository<ProductMapping>,
        @InjectRepository(ProductMovement)
        private productMovementRepository: Repository<ProductMovement>,
    ) { }

    /**
     * Find all parent products with optional search and seller filtering.
     * For PUBLIC_USER: excludes archived products.
     */
    async findAll(search?: string, sellerId?: string, excludeArchived = false): Promise<ParentProduct[]> {
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

        // Exclude archived products for PUBLIC_USER
        if (excludeArchived) {
            if (search || sellerId) {
                query.andWhere('product.is_archived = :archived', { archived: false });
            } else {
                query.where('product.is_archived = :archived', { archived: false });
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

    /**
     * Check if a product with the same name already exists for this seller.
     * Returns true if duplicate found (for warning), false otherwise.
     */
    async checkDuplicateName(sellerId: string, productName: string): Promise<boolean> {
        const existing = await this.parentProductsRepository.findOne({
            where: {
                seller_id: sellerId,
                product_name: productName,
                is_archived: false, // Only check non-archived
            },
        });
        return !!existing;
    }

    /**
     * Soft delete: set is_archived = true instead of hard delete.
     * Returns success message.
     */
    async softDelete(id: string, user: any): Promise<{ success: boolean; message: string }> {
        const product = await this.findOne(id);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        // For PUBLIC_USER, verify ownership
        if (user.role === 'public_user' && product.seller_id !== user.seller_id) {
            return { success: false, message: 'You can only delete your own products' };
        }

        await this.parentProductsRepository.update(id, { is_archived: true });

        return {
            success: true,
            message: 'Product archived successfully',
        };
    }

    // Keep hard delete for admin use
    async remove(id: string): Promise<void> {
        await this.parentProductsRepository.delete(id);
    }

    /**
     * Update stock and sync to all mapped marketplace products.
     * Creates ADJUSTMENT ProductMovement to track the change.
     */
    async updateStock(
        parentProductId: string,
        newStock: number,
        user: any
    ): Promise<{ success: boolean; parent_product: ParentProduct; sync_results: any[] }> {
        // Get current product
        const product = await this.findOne(parentProductId);
        if (!product) {
            throw new BadRequestException('Product not found');
        }

        const oldStock = product.stock;

        // Update parent product stock
        await this.parentProductsRepository.update(parentProductId, { stock: newStock });
        const updatedProduct = await this.findOne(parentProductId);

        // Get all mapped marketplace products
        const mappings = await this.productMappingRepository.find({
            where: { parent_product_id: parentProductId },
            relations: ['marketplace_product'],
        });

        // Sync stock to each mapped marketplace product
        const syncResults = [];
        const marketplaceClient = MarketplaceClientFactory.getClient();

        for (const mapping of mappings) {
            try {
                const success = await marketplaceClient.updateStock(
                    mapping.marketplace_product.external_product_id,
                    newStock
                );

                syncResults.push({
                    sku_id: mapping.marketplace_product.external_product_id,
                    sku_title: mapping.marketplace_product.title,
                    success,
                    error: success ? null : 'Update failed',
                });
            } catch (error) {
                syncResults.push({
                    sku_id: mapping.marketplace_product.external_product_id,
                    sku_title: mapping.marketplace_product.title,
                    success: false,
                    error: error.message || 'Unexpected error',
                });
            }
        }

        // Create ADJUSTMENT ProductMovement
        // Formula: quantity = newStock - oldStock
        // Location/status remain unchanged (SELLER_WAREHOUSE, FREE)
        const adjustmentQuantity = newStock - oldStock;

        // Get SELLER_WAREHOUSE and FREE IDs (hardcoded for now, ideally would query)
        const sellerWarehouseId = 1; // Assuming ID 1 for SELLER_WAREHOUSE
        const freeStatusId = 1; // Assuming ID 1 for FREE

        await this.productMovementRepository.save({
            parent_product_id: parentProductId,
            quantity: adjustmentQuantity,
            movement_type: MovementType.ADJUSTMENT,
            from_location_id: sellerWarehouseId,
            to_location_id: sellerWarehouseId,
            from_status_id: freeStatusId,
            to_status_id: freeStatusId,
            initiator_id: user.userId,
            comment: `Stock adjusted from ${oldStock} to ${newStock}`,
        } as any);

        return {
            success: true,
            parent_product: updatedProduct,
            sync_results: syncResults,
        };
    }
}
