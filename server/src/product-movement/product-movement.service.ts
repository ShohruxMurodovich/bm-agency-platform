import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException, UnprocessableEntityException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductMovementRequest } from './product-movement-request.entity';
import { ProductMovementItem } from './product-movement-item.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';

// New Imports
import { ProductMovement, MovementType, InitiatorType } from './product-movement.entity';
import { LocationsService } from '../inventory/locations/locations.service';
import { BusinessStatusService } from '../inventory/business-statuses/business-status.service';
import { ProductState } from '../inventory/stock-snapshots/product-state.entity';
import { LocationType } from '../inventory/locations/location.entity';

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

        // New Injections
        @InjectRepository(ProductMovement)
        private movementsRepo: Repository<ProductMovement>,
        @InjectRepository(ProductState)
        private productStateRepo: Repository<ProductState>,
        private locationsService: LocationsService,
        private statusService: BusinessStatusService,
        private dataSource: DataSource,
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

    // --- NEW LEDGER LOGIC ---

    private validateMovementMatrix(type: MovementType, fromType: LocationType, toType: LocationType): void {
        const matrix: Record<MovementType, { from: LocationType[], to: LocationType[] }> = {
            [MovementType.SELLER_TO_BM]: { from: [LocationType.SELLER_WAREHOUSE], to: [LocationType.BM_WAREHOUSE] },
            [MovementType.BM_TO_MARKETPLACE]: { from: [LocationType.BM_WAREHOUSE], to: [LocationType.MARKETPLACE_WAREHOUSE] },
            [MovementType.MARKETPLACE_SALE]: { from: [LocationType.MARKETPLACE_WAREHOUSE], to: [LocationType.SOLD] },
            [MovementType.CUSTOMER_RETURN]: { from: [LocationType.SOLD], to: [LocationType.RETURN_BUFFER] },
            [MovementType.MARKETPLACE_TO_BM_RETURN]: { from: [LocationType.RETURN_BUFFER], to: [LocationType.BM_WAREHOUSE] },
            [MovementType.BM_TO_SELLER]: { from: [LocationType.BM_WAREHOUSE, LocationType.RETURN_BUFFER], to: [LocationType.SELLER_WAREHOUSE] },
            [MovementType.WRITE_OFF]: { from: [LocationType.BM_WAREHOUSE, LocationType.RETURN_BUFFER, LocationType.DAMAGED_BUFFER], to: [LocationType.LOST] },
            [MovementType.ADJUSTMENT]: { from: [LocationType.UNKNOWN], to: [LocationType.BM_WAREHOUSE, LocationType.DAMAGED_BUFFER, LocationType.LOST] },
            [MovementType.STATUS_CHANGE]: {
                from: [LocationType.BM_WAREHOUSE, LocationType.SELLER_WAREHOUSE, LocationType.MARKETPLACE_WAREHOUSE, LocationType.RETURN_BUFFER],
                to: [LocationType.BM_WAREHOUSE, LocationType.SELLER_WAREHOUSE, LocationType.MARKETPLACE_WAREHOUSE, LocationType.RETURN_BUFFER]
            },
        };

        const rule = matrix[type];

        if (!rule || !rule.from.includes(fromType) || !rule.to.includes(toType)) {
            throw new UnprocessableEntityException(`Movement ${type} not allowed from ${fromType} to ${toType}`);
        }

        if (type === MovementType.STATUS_CHANGE && fromType !== toType) {
            throw new UnprocessableEntityException(`STATUS_CHANGE must stay in the same location type.`);
        }
    }

    async recordMovement(data: {
        from_location_code: string;
        to_location_code: string;
        from_status_code: string; // REQUIRED
        to_status_code: string;   // REQUIRED
        parent_product_id: string;
        quantity: number;
        movement_type: MovementType;
        initiator_type: InitiatorType;
        initiator_id?: string;
        related_document_id?: string;
        reason_code?: string;
        comment?: string;
        external_reference?: string;
    }): Promise<ProductMovement> {
        return this.dataSource.transaction(async (manager) => {
            // 1. Resolve Locations
            const fromLoc = await this.locationsService.findOneByCode(data.from_location_code);
            const toLoc = await this.locationsService.findOneByCode(data.to_location_code);

            if (!fromLoc || !toLoc) throw new NotFoundException(`Invalid location codes: ${data.from_location_code} -> ${data.to_location_code}`);

            // 2. Validate Matrix
            this.validateMovementMatrix(data.movement_type, fromLoc.location_type, toLoc.location_type);

            // 3. Resolve Statuses
            const fromStatus = await this.statusService.findOne(data.from_status_code);
            const toStatus = await this.statusService.findOne(data.to_status_code);

            if (!fromStatus) throw new NotFoundException(`Invalid From Status: ${data.from_status_code}`);
            if (!toStatus) throw new NotFoundException(`Invalid To Status: ${data.to_status_code}`);

            // Validation: STATUS_CHANGE MUST happen in same location
            if (data.movement_type === MovementType.STATUS_CHANGE) {
                if (fromLoc.id !== toLoc.id) {
                    throw new BadRequestException('STATUS_CHANGE movement must have same From and To locations.');
                }
                if (fromStatus.id === toStatus.id) {
                    throw new BadRequestException('STATUS_CHANGE must have different status codes.');
                }
            }

            // 4. Update Source Bucket (Product + Location + Status)

            // Lock Source State
            let fromState = await manager.findOne(ProductState, {
                where: {
                    parent_product_id: data.parent_product_id,
                    location_id: fromLoc.id,
                    business_status_id: fromStatus.id
                },
                lock: { mode: 'pessimistic_write' }
            });

            // Special Case: Initial Adjustment (Bootstrapping) may come from UNKNOWN/SYSTEM with no prior state?
            // Actually, UNKNOWN should ideally have state if we track "lost" items.
            // But if it's a true "Creation" adjustment from nothing, we might allow it if from_location is virtual/system and we accept negative or implicit zero?
            // "Acccounting Style": Credit must come from somewhere. 
            // If from_location is UNKNOWN/SYSTEM, and state doesn't exist, we treat it as 0? 
            // Users rule: "Validate sufficient quantity at from_location".
            // Exception: If LocationType is UNKNOWN and Movement is ADJUSTMENT, we might allow creating from thin air?
            // Let's stick to strict rules. data.adjustment FROM unknown must exist if we track unknown.
            // If we are "Injecting" stock, maybe from_location = UNKNOWN with infinite stock?

            // Implementation Decision: If from_location is VIRTUAL (like UNKNOWN/LOST) and state missing, assume 0.
            // But if we are moving FROM it, we expect it to have stock OR we are negative-balancing it (like double entry accounting against equity).
            // For now, allow 0 -> -X if from location is UNKNOWN/SYSTEM.

            if (!fromState) {
                // Determine if we can auto-create the source (e.g. for System accounts)
                fromState = manager.create(ProductState, {
                    parent_product_id: data.parent_product_id,
                    location_id: fromLoc.id,
                    business_status_id: fromStatus.id,
                    quantity: 0
                });
                await manager.save(fromState);
            }

            // Blockers Check
            if (fromStatus.blocks_operations && data.movement_type !== MovementType.WRITE_OFF && data.movement_type !== MovementType.ADJUSTMENT && data.movement_type !== MovementType.STATUS_CHANGE) {
                // Allow admins to move out of blocking statuses via write-off/adj/status-change.
                // But forbid normal commercial movements.
                throw new HttpException(`Product is in blocking status ${fromStatus.code} at source.`, HttpStatus.LOCKED);
            }

            // Check Stock Availability
            if (fromState.quantity < data.quantity) {
                // Allow UNKNOWN to go negative? (As an Equity/System account proxy)
                if (fromLoc.location_type !== LocationType.UNKNOWN) {
                    throw new ConflictException(`Insufficient stock in ${fromLoc.name} (${fromStatus.code}). Available: ${fromState.quantity}, Required: ${data.quantity}`);
                }
            }

            // 5. Update Destination Bucket
            let toState = await manager.findOne(ProductState, {
                where: {
                    parent_product_id: data.parent_product_id,
                    location_id: toLoc.id,
                    business_status_id: toStatus.id
                },
                lock: { mode: 'pessimistic_write' }
            });

            if (!toState) {
                toState = manager.create(ProductState, {
                    parent_product_id: data.parent_product_id,
                    location_id: toLoc.id,
                    business_status_id: toStatus.id,
                    quantity: 0
                });
                await manager.save(toState);
            }

            // 6. Create Immutable Movement Record
            const movement = manager.create(ProductMovement, {
                parent_product_id: data.parent_product_id,
                from_location: fromLoc,
                to_location: toLoc,
                from_status: fromStatus,
                to_status: toStatus,
                quantity: data.quantity,
                movement_type: data.movement_type,
                initiator_type: data.initiator_type,
                initiator_id: data.initiator_id,
                document_id: data.related_document_id, // e.g. Order ID
                reason_code: data.reason_code,
                comment: data.comment,
                external_reference: data.external_reference,
            });
            const savedMovement = await manager.save(movement);

            // 7. Apply Changes to States
            fromState.quantity -= data.quantity;
            fromState.last_movement_id = savedMovement.id;
            await manager.save(fromState);

            toState.quantity += data.quantity;
            toState.last_movement_id = savedMovement.id;
            await manager.save(toState);

            return savedMovement;
        });
    }

    async reverseMovement(movementId: string, initiatorId: string): Promise<ProductMovement> {
        return this.dataSource.transaction(async (manager) => {
            const original = await manager.findOne(ProductMovement, {
                where: { id: movementId },
                relations: ['from_location', 'to_location', 'from_status', 'to_status']
            });

            if (!original) throw new NotFoundException('Movement not found');
            if (original.is_reversal) throw new BadRequestException('Cannot reverse a reversal');

            // Check if already reversed
            const existingReversal = await manager.findOne(ProductMovement, { where: { reversed_movement_id: movementId } });
            if (existingReversal) throw new BadRequestException('Movement already reversed');

            const quantity = original.quantity;

            // 1. Restore Source (Undo decrease)
            // Original: From Loc/Status -> To Loc/Status
            // We need to ADD back to From Loc/Status
            // And TAKE from To Loc/Status

            // Lock 'To' State (This is where the stock is NOW, which we need to take back)
            const currentStateAtDestination = await manager.findOne(ProductState, {
                where: {
                    parent_product_id: original.parent_product_id,
                    location_id: original.to_location.id,
                    business_status_id: original.to_status.id
                },
                lock: { mode: 'pessimistic_write' }
            });

            if (!currentStateAtDestination || currentStateAtDestination.quantity < quantity) {
                // If destination doesn't have enough stock in that specific status bucket anymore
                throw new ConflictException('Cannot reverse: Destination bucket does not have sufficient stock to return items');
            }

            // Lock 'From' State (Where we put it back)
            let restoredSourceState = await manager.findOne(ProductState, {
                where: {
                    parent_product_id: original.parent_product_id,
                    location_id: original.from_location.id,
                    business_status_id: original.from_status.id
                },
                lock: { mode: 'pessimistic_write' }
            });

            if (!restoredSourceState) {
                restoredSourceState = manager.create(ProductState, {
                    parent_product_id: original.parent_product_id,
                    location_id: original.from_location.id,
                    business_status_id: original.from_status.id,
                    quantity: 0
                });
                await manager.save(restoredSourceState);
            }

            // Create Reversal Movement
            const reversal = manager.create(ProductMovement, {
                parent_product_id: original.parent_product_id,
                from_location: original.to_location,   // Swap
                to_location: original.from_location,   // Swap
                from_status: original.to_status,       // Swap
                to_status: original.from_status,       // Swap
                quantity: quantity,
                movement_type: original.movement_type, // Keep type or mark as Adjustment? Usually keep type + acts as reversal
                initiator_type: InitiatorType.USER,
                initiator_id: initiatorId,
                is_reversal: true,
                reversed_movement_id: original.id,
                comment: `Reversal of movement ${original.id}`
            });

            const savedReversal = await manager.save(reversal);

            // Apply State Updates
            currentStateAtDestination.quantity -= quantity;
            currentStateAtDestination.last_movement_id = savedReversal.id;
            await manager.save(currentStateAtDestination);

            restoredSourceState.quantity += quantity;
            restoredSourceState.last_movement_id = savedReversal.id;
            await manager.save(restoredSourceState);

            return savedReversal;
        });
    }

    async getStock(parentProductId: string, locationId: string, statusId?: string): Promise<number> {
        const where: any = { parent_product_id: parentProductId, location_id: locationId };
        if (statusId) {
            where.business_status_id = statusId;
        }

        const states = await this.productStateRepo.find({ where });
        return states.reduce((sum, state) => sum + state.quantity, 0);
    }

    // --- FRONTEND READ MODELS ---

    async getInventorySummary(parentProductId: string): Promise<any> {
        // 1. Get all stock states
        const states = await this.productStateRepo.find({
            where: { parent_product_id: parentProductId },
            relations: ['location', 'business_status']
        });

        // 2. Format response: Location -> Status -> Qty
        // Flatten for table: Location | Status | Qty
        const breakdown = states.map(s => ({
            location: s.location.name,
            location_type: s.location.location_type,
            status: s.business_status.description,
            status_code: s.business_status.code,
            qty: s.quantity
        })).filter(s => s.qty !== 0);

        return {
            productId: parentProductId,
            breakdown,
            totalStock: breakdown.reduce((sum, s) => sum + s.qty, 0),
        };
    }

    async getMovementHistory(parentProductId: string): Promise<ProductMovement[]> {
        return this.movementsRepo.find({
            where: { parent_product_id: parentProductId },
            relations: ['from_location', 'to_location', 'from_status', 'to_status'],
            order: { recorded_at: 'DESC' }
        });
    }

    async getMovements(filters?: {
        productSearch?: string;
        movementType?: string;
        locationId?: string;
        dateFrom?: string;
        sellerId?: string;
        productId?: string;
        fromLocationId?: string;
        toLocationId?: string;
        initiatorId?: string;
    }): Promise<ProductMovement[]> {
        const query = this.movementsRepo.createQueryBuilder('movement')
            .leftJoinAndSelect('movement.parent_product', 'product')
            .leftJoinAndSelect('movement.from_location', 'fromLocation')
            .leftJoinAndSelect('movement.to_location', 'toLocation')
            .leftJoinAndSelect('movement.from_status', 'fromStatus')
            .leftJoinAndSelect('movement.to_status', 'toStatus');

        // Apply filters
        if (filters?.productSearch) {
            query.andWhere(
                '(product.product_name ILIKE :search OR product.id::text ILIKE :search)',
                { search: `%${filters.productSearch}%` }
            );
        }

        if (filters?.movementType) {
            query.andWhere('movement.movement_type = :type', { type: filters.movementType });
        }

        if (filters?.locationId) {
            query.andWhere(
                '(movement.from_location_id = :locId OR movement.to_location_id = :locId)',
                { locId: filters.locationId }
            );
        }

        if (filters?.dateFrom) {
            query.andWhere('movement.occurred_at >= :dateFrom', { dateFrom: filters.dateFrom });
        }

        // New Filters
        if (filters?.sellerId) {
            // Filter by parent_product's seller_id
            query.andWhere('product.seller_id = :sellerId', { sellerId: filters.sellerId });
        }

        if (filters?.productId) {
            query.andWhere('movement.parent_product_id = :productId', { productId: filters.productId });
        }

        if (filters?.fromLocationId) {
            query.andWhere('movement.from_location_id = :fromLocId', { fromLocId: filters.fromLocationId });
        }

        if (filters?.toLocationId) {
            query.andWhere('movement.to_location_id = :toLocId', { toLocId: filters.toLocationId });
        }

        if (filters?.initiatorId) {
            query.andWhere('movement.initiator_id = :initiatorId', { initiatorId: filters.initiatorId });
        }

        return query
            .orderBy('movement.occurred_at', 'DESC')
            .limit(500) // Limit to prevent too many results
            .getMany();
    }
}
