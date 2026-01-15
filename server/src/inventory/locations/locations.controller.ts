import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { LocationType } from './location.entity';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findAll() {
        return this.locationsService.findAll();
    }

    /**
     * GET /locations/public
     * Returns only public-allowed location types (filters out BM_WAREHOUSE).
     * 
     * Allowed: SELLER_WAREHOUSE, MARKETPLACE_WAREHOUSE, MARKETPLACE_RETURN_BUFFER,
     *          DAMAGED_BUFFER, LOST, UNKNOWN (only if exists in DB)
     * Blocked: BM_WAREHOUSE
     */
    @Get('public')
    async getPublicLocations() {
        const allowedTypes = [
            LocationType.SELLER_WAREHOUSE,
            LocationType.MARKETPLACE_WAREHOUSE,
            LocationType.MARKETPLACE_RETURN_BUFFER,
            LocationType.DAMAGED_BUFFER,
            LocationType.LOST,
            LocationType.UNKNOWN,
        ];

        const allLocations = await this.locationsService.findAll();

        // Filter to only include allowed location types
        return allLocations.filter(location =>
            allowedTypes.includes(location.location_type)
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }
}
