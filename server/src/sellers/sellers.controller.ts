import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { Seller } from './seller.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('sellers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SellersController {
    constructor(private readonly sellersService: SellersService) { }

    /**
     * GET /sellers/me
     * Returns the authenticated user's seller profile.
     * Used by PUBLIC_USER for onboarding status and profile info.
     * IMPORTANT: Must come BEFORE /sellers/:id to avoid route collision
     */
    @Get('me')
    @Roles(UserRole.SELLER, UserRole.PUBLIC_USER)
    async getMyProfile(@Request() req: any) {
        const sellerId = req.user.seller_id;
        if (!sellerId) {
            return null;
        }
        return this.sellersService.findOne(sellerId);
    }

    /**
     * PATCH /sellers/me/complete-onboarding
     * Mark onboarding as completed for the current user's seller
     */
    @Patch('me/complete-onboarding')
    @Roles(UserRole.PUBLIC_USER)
    async completeOnboarding(@Request() req: any): Promise<{ success: boolean; message: string }> {
        const sellerId = req.user.seller_id;

        if (!sellerId) {
            return { success: false, message: 'Seller ID not found' };
        }

        await this.sellersService.update(sellerId, { onboarding_completed: true });

        return { success: true, message: 'Onboarding completed' };
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(): Promise<Seller[]> {
        return this.sellersService.findAll();
    }

    @Get(':id/stores')
    @Roles(UserRole.ADMIN)
    getStores(@Param('id') id: string): Promise<any[]> {
        return this.sellersService.getStores(id);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    findOne(@Param('id') id: string): Promise<Seller> {
        return this.sellersService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() sellerData: Partial<Seller>): Promise<Seller> {
        return this.sellersService.create(sellerData);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() sellerData: Partial<Seller>): Promise<Seller> {
        return this.sellersService.update(id, sellerData);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.sellersService.remove(id);
    }
}
