import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('system')
@UseGuards(AuthGuard('jwt'))
export class SystemController {
    constructor(private readonly systemService: SystemService) { }

    @Get('status')
    async getStatus() {
        return this.systemService.getStatus();
    }

    @Get('logs')
    @UseGuards(AuthGuard('jwt'))
    async getLogs() {
        return this.systemService.getLogs();
    }
}
