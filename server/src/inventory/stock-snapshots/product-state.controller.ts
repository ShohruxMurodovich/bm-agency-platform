import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { UserRole } from '../../users/user.entity';
import { ProductStateService } from './product-state.service';

@Controller('product-states')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductStateController {
    constructor(private readonly productStateService: ProductStateService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.COURIER)
    findAll(
        @Query('product') productSearch?: string,
        @Query('location') locationId?: string,
        @Query('status') statusId?: string,
        @Query('showZeroQty') showZeroQty?: string,
    ) {
        return this.productStateService.findAll({
            productSearch,
            locationId,
            statusId,
            showZeroQty: showZeroQty === 'true',
        });
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.COURIER)
    findOne(@Param('id') id: string) {
        return this.productStateService.findOne(id);
    }
}
