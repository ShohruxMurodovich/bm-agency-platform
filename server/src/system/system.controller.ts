import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('system')
export class SystemController {
    constructor(private readonly systemService: SystemService) { }

    @Get('status')
    async getStatus() {
        return this.systemService.getStatus();
    }

    @Get('logs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getLogs() {
        return this.systemService.getLogs();
    }
}
