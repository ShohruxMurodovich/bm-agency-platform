import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductMovement, MovementType } from './product-movement.entity';
import { MovementOrderMapping } from './movement-order-mapping.entity';
import { MovementOrderAuditLog } from './movement-order-audit-log.entity';
import { ProductState } from '../inventory/stock-snapshots/product-state.entity';
import { Location } from '../inventory/locations/location.entity';
import { BusinessStatus } from '../inventory/business-statuses/business-status.entity';

// Movement types that cannot be assigned to orders at all
const STRICTLY_RESTRICTED_TYPES = [
    MovementType.ADJUSTMENT,
    // Add STOCKTAKE when it exists in the enum
];

// Movement types that require mandatory comment
const COMMENT_REQUIRED_TYPES = [
    MovementType.WRITE_OFF,
    MovementType.DAMAGE, // Requires comment for assignment
];

interface OrderListFilters {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    movementType?: MovementType;
    locationId?: string;
    marketplace?: string;
    limit?: number;
    offset?: number;
}

export interface OrderSummary {
    effective_order_number: string;
    last_movement_at: Date;
    items_count: number;
    movements_count: number;
    current_location?: string;
    is_mixed_location?: boolean;
    current_status?: string;
    is_mixed_status?: boolean;
}

export interface ProductInOrder {
    parent_product_id: string;
    product_name: string;
    sku: string;
    current_location: string;
    current_status: string;
    last_movement_at: Date;
    movements_count: number;
}

@Injectable()
export class ProductTrackingService {
    constructor(
        @InjectRepository(ProductMovement)
        private productMovementRepo: Repository<ProductMovement>,
        @InjectRepository(MovementOrderMapping)
        private mappingRepo: Repository<MovementOrderMapping>,
        @InjectRepository(MovementOrderAuditLog)
        private auditLogRepo: Repository<MovementOrderAuditLog>,
        @InjectRepository(ProductState)
        private productStateRepo: Repository<ProductState>,
        @InjectRepository(Location)
        private locationRepo: Repository<Location>,
        @InjectRepository(BusinessStatus)
        private businessStatusRepo: Repository<BusinessStatus>,
        private dataSource: DataSource,
    ) { }

    /**
     * Get list of orders with aggregated summary
     * TAB 1 - Level 1
     * NOTE: Tenant filtering handled automatically by @TenantScoped decorator
     */
    async getOrdersList(
        filters: OrderListFilters = {}
    ): Promise<{ data: OrderSummary[]; total: number }> {
        const {
            search,
            dateFrom,
            dateTo,
            movementType,
            locationId,
            limit = 20,
            offset = 0,
        } = filters;

        // Build query with COALESCE for effective_order_number
        let query = this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .where('(pm.order_number IS NOT NULL OR mom.order_number IS NOT NULL)');

        // Search filter
        if (search) {
            query = query.andWhere(
                '(COALESCE(pm.order_number, mom.order_number) ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Movement type filter
        if (movementType) {
            query = query.andWhere('pm.movement_type = :movementType', { movementType });
        }

        // Location filter (from or to)
        if (locationId) {
            query = query.andWhere(
                '(pm.from_location_id = :locationId OR pm.to_location_id = :locationId)',
                { locationId }
            );
        }

        // Group by effective order number and aggregate
        query = query
            .select('COALESCE(pm.order_number, mom.order_number)', 'effective_order_number')
            .addSelect('MAX(pm.occurred_at)', 'last_movement_at')
            .addSelect('COUNT(DISTINCT pm.parent_product_id)', 'items_count')
            .addSelect('COUNT(pm.id)', 'movements_count')
            .groupBy('effective_order_number');

        // Date range filter - CRITICAL: use HAVING on aggregated last_movement_at
        if (dateFrom) {
            query = query.having('MAX(pm.occurred_at) >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            query = query.andHaving('MAX(pm.occurred_at) <= :dateTo', { dateTo });
        }

        // Get total count
        const totalQuery = query.clone();
        const totalResult = await totalQuery.getRawMany();
        const total = totalResult.length;

        // Apply pagination and sorting
        const results = await query
            .orderBy('last_movement_at', 'DESC')
            .limit(limit)
            .offset(offset)
            .getRawMany();

        // Enrich with current location/status for each order
        const enrichedData = await Promise.all(
            results.map(async (row) => {
                const locationStatus = await this.getOrderCurrentLocationStatus(
                    row.effective_order_number
                );
                return {
                    ...row,
                    ...locationStatus,
                };
            })
        );

        return { data: enrichedData, total };
    }

    /**
     * Get current location and status for an order
     * Uses two-query approach per implementation plan
     */
    private async getOrderCurrentLocationStatus(
        orderNumber: string
    ): Promise<{
        current_location: string;
        is_mixed_location: boolean;
        current_status: string;
        is_mixed_status: boolean;
    }> {
        // Step 1: Get product IDs for this order
        const productIds = await this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .select('DISTINCT pm.parent_product_id', 'parent_product_id')
            .where('COALESCE(pm.order_number, mom.order_number) = :orderNumber', { orderNumber })
            .getRawMany();

        if (productIds.length === 0) {
            return {
                current_location: 'Unknown',
                is_mixed_location: false,
                current_status: 'Unknown',
                is_mixed_status: false,
            };
        }

        const parentProductIds = productIds.map((p) => p.parent_product_id);

        // Step 2: Query ProductState for those products
        const result = await this.productStateRepo
            .createQueryBuilder('ps')
            .leftJoin('ps.location', 'l')
            .leftJoin('ps.business_status', 'bs')
            .select([
                'CASE WHEN COUNT(DISTINCT ps.location_id) = 1 THEN MAX(l.name) ELSE \'Mixed\' END AS current_location',
                '(COUNT(DISTINCT ps.location_id) > 1) AS is_mixed_location',
                'CASE WHEN COUNT(DISTINCT ps.business_status_id) = 1 THEN MAX(bs.name) ELSE \'Mixed\' END AS current_status',
                '(COUNT(DISTINCT ps.business_status_id) > 1) AS is_mixed_status',
            ])
            .where('ps.parent_product_id IN (:...parentProductIds)', { parentProductIds })
            .andWhere('ps.quantity > 0')
            .getRawOne();

        return result || {
            current_location: 'Unknown',
            is_mixed_location: false,
            current_status: 'Unknown',
            is_mixed_status: false,
        };
    }

    /**
     * Get products within a specific order
     * TAB 1 - Level 2
     */
    async getOrderProducts(
        orderNumber: string
    ): Promise<ProductInOrder[]> {
        // Get product aggregations
        const products = await this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .leftJoin('pm.parent_product', 'pp')
            .select([
                'pm.parent_product_id AS parent_product_id',
                'pp.product_name AS product_name',
                'pp.sku AS sku',
                'MAX(pm.occurred_at) AS last_movement_at',
                'COUNT(pm.id) AS movements_count',
            ])
            .where('COALESCE(pm.order_number, mom.order_number) = :orderNumber', { orderNumber })
            .groupBy('pm.parent_product_id, pp.product_name, pp.sku')
            .getRawMany();

        // Enrich with current location and status from ProductState
        const enrichedProducts = await Promise.all(
            products.map(async (product) => {
                const state = await this.productStateRepo
                    .createQueryBuilder('ps')
                    .leftJoin('ps.location', 'l')
                    .leftJoin('ps.business_status', 'bs')
                    .select(['l.name AS location_name', 'bs.name AS status_name'])
                    .where('ps.parent_product_id = :parentProductId', {
                        parentProductId: product.parent_product_id,
                    })
                    .andWhere('ps.quantity > 0')
                    .orderBy('ps.quantity', 'DESC')
                    .limit(1)
                    .getRawOne();

                return {
                    ...product,
                    current_location: state?.location_name || 'Unknown',
                    current_status: state?.status_name || 'Unknown',
                };
            })
        );

        return enrichedProducts;
    }

    /**
     * Get movement details for a specific product in an order
     * TAB 1 - Level 3
     */
    async getOrderProductMovements(
        orderNumber: string,
        productId: string
    ) {
        const movements = await this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .leftJoin('pm.from_location', 'from_loc')
            .leftJoin('pm.to_location', 'to_loc')
            .select([
                'pm.id',
                'pm.occurred_at',
                'pm.movement_type',
                'pm.quantity',
                'pm.comment',
                'from_loc.name AS from_location',
                'to_loc.name AS to_location',
            ])
            .where('COALESCE(pm.order_number, mom.order_number) = :orderNumber', { orderNumber })
            .andWhere('pm.parent_product_id = :productId', { productId })
            .orderBy('pm.occurred_at', 'DESC')
            .getRawMany();

        return movements;
    }

    /**
     * Get movements without order_number
     * TAB 2
     */
    async getUnassignedMovements(
        filters: OrderListFilters = {}
    ) {
        const { search, dateFrom, dateTo, movementType, locationId, limit = 20, offset = 0 } = filters;

        let query = this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .leftJoin('pm.parent_product', 'pp')
            .leftJoin('pm.from_location', 'from_loc')
            .leftJoin('pm.to_location', 'to_loc')
            .select([
                'pm.id',
                'pm.occurred_at',
                'pm.movement_type',
                'pm.quantity',
                'pp.product_name',
                'pp.sku',
                'pm.parent_product_id',
                'from_loc.name AS from_location',
                'to_loc.name AS to_location',
            ])
            .where('pm.order_number IS NULL')
            .andWhere('mom.order_number IS NULL'); // CRITICAL: exclude manually assigned

        // Search filter
        if (search) {
            query = query.andWhere(
                '(pp.product_name ILIKE :search OR pp.sku ILIKE :search OR pm.parent_product_id::text ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Date filter
        if (dateFrom) {
            query = query.andWhere('pm.occurred_at >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            query = query.andWhere('pm.occurred_at <= :dateTo', { dateTo });
        }

        // Movement type filter
        if (movementType) {
            query = query.andWhere('pm.movement_type = :movementType', { movementType });
        }

        // Location filter
        if (locationId) {
            query = query.andWhere(
                '(pm.from_location_id = :locationId OR pm.to_location_id = :locationId)',
                { locationId }
            );
        }

        const [data, total] = await query
            .orderBy('pm.occurred_at', 'DESC')
            .limit(limit)
            .offset(offset)
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Assign order number to a movement (manual assignment)
     * Uses atomic UPSERT to prevent race conditions
     * CRITICAL: sellerId param ensures tenant isolation in raw SQL
     */
    async assignOrderNumber(
        movementId: string,
        orderNumber: string,
        userId: string,
        sellerId: string,
        comment?: string
    ) {
        // Trim and validate order_number format
        const trimmedOrderNumber = orderNumber.trim();
        if (trimmedOrderNumber.length < 3) {
            throw new BadRequestException('Order number must be at least 3 characters');
        }
        if (!/^[a-zA-Z0-9\-_\/]+$/.test(trimmedOrderNumber)) {
            throw new BadRequestException('Order number contains invalid characters. Only alphanumeric, -, _, / allowed');
        }

        // Find movement and validate (TenantScoped ensures it belongs to current tenant)
        const movement = await this.productMovementRepo.findOne({
            where: { id: movementId },
        });

        if (!movement) {
            throw new NotFoundException('Movement not found');
        }

        // Cannot override marketplace-provided order_number
        if (movement.order_number) {
            throw new BadRequestException('Cannot override marketplace-provided order number');
        }

        // Check movement type restrictions
        if (STRICTLY_RESTRICTED_TYPES.includes(movement.movement_type)) {
            throw new BadRequestException('This movement type cannot be assigned to orders');
        }

        if (COMMENT_REQUIRED_TYPES.includes(movement.movement_type) && !comment?.trim()) {
            throw new BadRequestException(
                'Comment is required when assigning WRITE_OFF or DAMAGE movements'
            );
        }

        // Atomic transaction
        return await this.dataSource.transaction(async (manager) => {
            // 1. Read old value for audit (with pessimistic lock)
            const oldMapping = await manager.findOne(MovementOrderMapping, {
                where: { movement_id: movementId },
                lock: { mode: 'pessimistic_write' },
            });
            const oldValue = oldMapping?.order_number || null;

            // 2. Atomic UPSERT using raw query (PostgreSQL)
            // CRITICAL: Raw SQL bypasses @TenantScoped, so we add explicit seller_id filter
            // First verify movement belongs to tenant before UPSERT
            const movementCheck = await manager.query(
                `SELECT id FROM product_movements WHERE id = $1 AND seller_id = $2`,
                [movementId, sellerId]
            );
            if (!movementCheck || movementCheck.length === 0) {
                throw new NotFoundException('Movement not found or access denied');
            }

            await manager.query(
                `
                INSERT INTO movement_order_mappings (movement_id, order_number, created_by, comment, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                ON CONFLICT (movement_id) 
                DO UPDATE SET 
                    order_number = EXCLUDED.order_number,
                    updated_at = NOW(),
                    updated_by = EXCLUDED.created_by,
                    comment = EXCLUDED.comment
                `,
                [movementId, trimmedOrderNumber, userId, comment || null]
            );

            // 3. Insert audit log
            await manager.insert(MovementOrderAuditLog, {
                movement_id: movementId,
                user_id: userId,
                old_value: oldValue,
                new_value: trimmedOrderNumber,
                comment: comment || null,
            });

            return {
                movement,
                effective_order_number: trimmedOrderNumber,
            };
        });
    }

    /**
     * Get autocomplete suggestions for order_number
     * Uses UNION + DISTINCT + ORDER BY last_seen DESC
     * Note: Tenant isolation handled by TenantScoped on ProductMovement
     */
    async getOrderNumberSuggestions(
        query: string,
        limit: number = 10
    ): Promise<{ order_number: string; last_seen: Date }[]> {
        const searchPattern = `%${query}%`;

        // Note: We cannot easily filter by tenant in raw SQL with TenantScoped
        // So we'll use QueryBuilder instead
        const marketplaceOrders = await this.productMovementRepo
            .createQueryBuilder('pm')
            .select('DISTINCT pm.order_number', 'order_number')
            .addSelect('MAX(pm.occurred_at)', 'last_seen')
            .where('pm.order_number IS NOT NULL')
            .andWhere('pm.order_number ILIKE :searchPattern', { searchPattern })
            .groupBy('pm.order_number')
            .getRawMany();

        const manualOrders = await this.productMovementRepo
            .createQueryBuilder('pm')
            .leftJoin('movement_order_mappings', 'mom', 'pm.id = mom.movement_id')
            .select('DISTINCT mom.order_number', 'order_number')
            .addSelect('MAX(pm.occurred_at)', 'last_seen')
            .where('mom.order_number IS NOT NULL')
            .andWhere('mom.order_number ILIKE :searchPattern', { searchPattern })
            .groupBy('mom.order_number')
            .getRawMany();

        // Combine and sort
        const combined = [...marketplaceOrders, ...manualOrders];
        const uniqueMap = new Map<string, Date>();

        for (const item of combined) {
            if (!uniqueMap.has(item.order_number) || uniqueMap.get(item.order_number)! < item.last_seen) {
                uniqueMap.set(item.order_number, item.last_seen);
            }
        }

        const results = Array.from(uniqueMap.entries())
            .map(([order_number, last_seen]) => ({ order_number, last_seen }))
            .sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime())
            .slice(0, limit);

        return results;
    }

    /**
     * Get audit log for a movement's order number assignments
     */
    async getMovementAuditLog(movementId: string) {
        // First verify movement exists (TenantScoped ensures it belongs to current tenant)
        const movement = await this.productMovementRepo.findOne({
            where: { id: movementId },
        });

        if (!movement) {
            throw new NotFoundException('Movement not found');
        }

        const logs = await this.auditLogRepo
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user')
            .where('log.movement_id = :movementId', { movementId })
            .orderBy('log.created_at', 'DESC')
            .getMany();

        return logs;
    }
}
