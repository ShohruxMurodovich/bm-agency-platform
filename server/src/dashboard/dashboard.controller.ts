import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.SELLER, UserRole.COURIER, UserRole.PUBLIC_USER)
    async getStats(@Request() req) {
        return this.dashboardService.getStats(req.user);
    }
}
