import { Controller, Request, Post, UseGuards, Get, Body, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() req: any) {
        this.logger.log(`Login attempt for email: ${req.email}`);
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            this.logger.warn(`Login failed for email: ${req.email}`);
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req: any) {
        return req.user;
    }
}
