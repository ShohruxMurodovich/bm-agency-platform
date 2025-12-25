import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location, LocationType, OwnerType } from './location.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private locationsRepo: Repository<Location>,
    ) { }

    async findAll(): Promise<Location[]> {
        return this.locationsRepo.find({ where: { is_active: true } });
    }

    async findOne(id: string): Promise<Location> {
        const location = await this.locationsRepo.findOne({ where: { id } });
        if (!location) throw new NotFoundException('Location not found');
        return location;
    }

    async findOneByCode(code: string): Promise<Location> {
        return this.locationsRepo.findOne({ where: { code } });
    }

    async ensureLocationExists(
        type: LocationType,
        ownerType: OwnerType = OwnerType.SYSTEM,
        ownerId?: string,
        name?: string
    ): Promise<Location> {
        // Generate a stable code for the location
        const code = this.generateLocationCode(type, ownerType, ownerId);

        let location = await this.locationsRepo.findOne({ where: { code } });

        if (!location) {
            location = this.locationsRepo.create({
                code,
                name: name || this.generateDefaultName(type, ownerId),
                location_type: type,
                owner_type: ownerType,
                owner_id: ownerId,
                is_virtual: [LocationType.LOST, LocationType.UNKNOWN].includes(type),
            });
            await this.locationsRepo.save(location);
        }

        return location;
    }

    private generateLocationCode(type: LocationType, ownerType: OwnerType, ownerId?: string): string {
        // Enforce strict naming rules
        if ([LocationType.LOST, LocationType.UNKNOWN].includes(type)) {
            return `${type}`; // Global locations
        }

        if (ownerType === OwnerType.SYSTEM) {
            return `${type}_SYSTEM`;
        }

        if (!ownerId) {
            throw new Error(`Owner ID required for non-system location type ${type}`);
        }
        return `${type}_${ownerId}`;
    }

    private generateDefaultName(type: LocationType, ownerId?: string): string {
        const readableType = type.replace(/_/g, ' ');
        if (ownerId) {
            return `${readableType} (${ownerId})`;
        }
        return readableType;
    }

    // Seed basic system locations
    async onModuleInit() {
        await this.ensureLocationExists(LocationType.BM_WAREHOUSE, OwnerType.SYSTEM, undefined, 'BM Main Warehouse');
        await this.ensureLocationExists(LocationType.DAMAGED_BUFFER, OwnerType.SYSTEM, undefined, 'Damaged Goods Buffer');
        await this.ensureLocationExists(LocationType.LOST, OwnerType.SYSTEM, undefined, 'Lost Items (Virtual)');
        await this.ensureLocationExists(LocationType.UNKNOWN, OwnerType.SYSTEM, undefined, 'Unknown Location (Virtual)');
    }
}
