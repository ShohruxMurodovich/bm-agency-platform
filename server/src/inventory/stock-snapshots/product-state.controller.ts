import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { UserRole } from '../../users/user.entity';
import { ProductStateService } from './product-state.service';

@Controller('product-states')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductStateController {
    constructor(private readonly productStateService: ProductStateService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.COURIER, UserRole.PUBLIC_USER)
    async findAll(
        @Query('parent_product_id') parentProductId?: string,
        @Query('location_id') locationId?: string,
        @Query('status_id') statusId?: string,
        @Query('show_zero_qty') showZeroQty?: string,
        @Request() req?: any,
    ) {
        return this.productStateService.findAll({
            parentProductId,
            locationId,
            statusId,
            showZeroQty: showZeroQty === 'true',
            sellerId: req?.user?.seller_id,
            userRole: req?.user?.role,
        });
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.COURIER)
    findOne(@Param('id') id: string) {
        return this.productStateService.findOne(id);
    }
}
