import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SellersService } from '../sellers/sellers.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole, SubscriptionPlan } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private sellersService: SellersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password_hash)) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }

    async getUserById(userId: string) {
        return await this.usersService.findOneById(userId);
    }

    async login(user: any) {
        // Get seller_id if user is a seller or public_user
        let sellerId = null;
        if (user.role === UserRole.SELLER || user.role === UserRole.PUBLIC_USER) {
            const seller = await this.sellersService.findByUserId(user.id);
            sellerId = seller?.id || null;
        }

        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            seller_id: sellerId,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    /**
     * Register a new PUBLIC_USER with auto-created seller and trial subscription.
     */
    async registerPublicUser(dto: {
        email: string;
        password: string;
        business_name?: string;
        phone?: string;
    }) {
        // Check if user already exists
        const existingUser = await this.usersService.findOneByEmail(dto.email);
        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        // Hash password
        const password_hash = await bcrypt.hash(dto.password, 10);

        // Create user with PUBLIC_USER role
        const user = await this.usersService.create({
            email: dto.email,
            password_hash,
            role: UserRole.PUBLIC_USER,
            subscription_plan: SubscriptionPlan.FREE,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        });

        // Create linked seller
        const seller = await this.sellersService.create({
            user_id: user.id,
            name: dto.business_name || dto.email.split('@')[0],
            phone_number: dto.phone || null,
            max_stores: 2, // Free plan limit
            is_public_saas_user: true,
        });

        // Generate JWT token
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            seller_id: seller.id,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                subscription_plan: user.subscription_plan,
                trial_ends_at: user.trial_ends_at,
            },
            seller: {
                id: seller.id,
                name: seller.name,
                max_stores: seller.max_stores,
            },
        };
    }
}
