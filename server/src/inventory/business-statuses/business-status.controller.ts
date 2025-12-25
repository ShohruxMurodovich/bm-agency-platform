import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BusinessStatusService } from './business-status.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../users/user.entity';

@Controller('business-statuses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessStatusController {
    constructor(private readonly businessStatusService: BusinessStatusService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findAll() {
        return this.businessStatusService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.COURIER)
    findOne(@Param('id') id: string) {
        return this.businessStatusService.findOne(id);
    }
}
