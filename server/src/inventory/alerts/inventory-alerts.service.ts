import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ProductState } from '../stock-snapshots/product-state.entity';
import { Location, LocationType, OwnerType } from '../locations/location.entity';
import { ProductMovementService } from '../../product-movement/product-movement.service';
import { MovementType, InitiatorType } from '../../product-movement/product-movement.entity';
import { LocationsService } from '../locations/locations.service'; // Added import

@Injectable()
export class InventoryAlertsService {
    private readonly logger = new Logger(InventoryAlertsService.name);

    constructor(
        @InjectRepository(ProductState)
        private snapshotsRepo: Repository<ProductState>,
        private movementService: ProductMovementService,
        private locationsService: LocationsService // Injected service
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Run daily
    async checkBufferSla() {
        this.logger.log('Running Buffer SLA Check...');

        // 7 days ago
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - 7);

        // Find items in buffers updated > 7 days ago
        const staleSnapshots = await this.snapshotsRepo.find({
            where: {
                updated_at: LessThan(dateThreshold),
                // We need to filter by location types, but TypeORM basic find is limited for related fields if not joining.
                // Better to use QueryBuilder.
            },
            relations: ['location', 'business_status']
        });

        const targetSnapshots = staleSnapshots.filter(s =>
            (s.location.location_type === LocationType.RETURN_BUFFER ||
                s.location.location_type === LocationType.DAMAGED_BUFFER) &&
            s.quantity > 0
        );

        this.logger.log(`Found ${targetSnapshots.length} stale items in buffers.`);

        for (const snapshot of targetSnapshots) {
            try {
                // Determine target "UNKNOWN" location
                const unknownLoc = await this.locationsService.ensureLocationExists(LocationType.UNKNOWN, OwnerType.SYSTEM);

                await this.movementService.recordMovement({
                    from_location_code: snapshot.location.code,
                    to_location_code: unknownLoc.code,
                    from_status_code: snapshot.business_status.code,
                    to_status_code: snapshot.business_status.code, // Keep status, change location
                    parent_product_id: snapshot.parent_product_id,
                    quantity: snapshot.quantity,
                    movement_type: MovementType.ADJUSTMENT,
                    initiator_type: InitiatorType.SYSTEM,
                    reason_code: 'SLA_BREACH',
                    comment: `Auto-moved due to Buffer SLA breach (>7 days in ${snapshot.location.name})`
                });

                this.logger.log(`Moved ${snapshot.quantity} of ${snapshot.parent_product_id} to UNKNOWN due to SLA.`);
            } catch (error) {
                this.logger.error(`Failed to move stale item ${snapshot.id}: ${error.message}`);
            }
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async checkPendingRequests() {
        // Placeholder for pending requests check
        this.logger.log('Checking for long-pending requests (Placeholder)...');
    }
}
