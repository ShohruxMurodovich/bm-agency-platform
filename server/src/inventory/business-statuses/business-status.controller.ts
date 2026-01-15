import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BusinessStatusService } from './business-status.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { StatusType } from './business-status.entity';

@Controller('business-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessStatusController {
    constructor(private readonly businessStatusService: BusinessStatusService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findAll() {
        return this.businessStatusService.findAll();
    }

    /**
     * GET /business-statuses/public
     * Returns only public-allowed business statuses.
     * IMPORTANT: Must come BEFORE /:id to avoid route collision
     * 
     * Allowed: FREE, RETURN_REQUESTED, RETURN_RECEIVED, RETURNED_TO_SELLER,
     *          DAMAGED, LOST, UNKNOWN (only if exists in DB)
     */
    @Get('public')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER, UserRole.PUBLIC_USER)
    async getPublicStatuses() {
        const allowedStatuses = [
            StatusType.FREE,
            StatusType.RETURN_REQUESTED,
            StatusType.RETURN_RECEIVED,
            StatusType.RETURNED_TO_SELLER,
            StatusType.DAMAGED,
            StatusType.LOST,
            StatusType.UNKNOWN,
        ];

        const allStatuses = await this.businessStatusService.findAll();

        // Filter to only include allowed statuses
        return allStatuses.filter(status =>
            status.code && allowedStatuses.includes(status.code as StatusType)
        );
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findOne(@Param('id') id: string) {
        return this.businessStatusService.findOne(id);
    }
}
