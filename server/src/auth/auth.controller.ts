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
    async getProfile(@Request() req: any) {
        // Fetch full user data from database instead of just returning JWT payload
        const user = await this.authService.getUserById(req.user.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Return user data without password hash
        const { password_hash, ...userData } = user;
        return userData;
    }

    /**
     * POST /auth/register
     * Public registration endpoint for new PUBLIC_USER accounts.
     * Creates user + seller, starts trial, returns JWT.
     */
    @Post('register')
    async register(@Body() dto: {
        email: string;
        password: string;
        business_name?: string;
        phone?: string;
    }) {
        this.logger.log(`Registration attempt for email: ${dto.email}`);
        const result = await this.authService.registerPublicUser(dto);
        this.logger.log(`Registration successful for email: ${dto.email}`);
        return result;
    }
}
