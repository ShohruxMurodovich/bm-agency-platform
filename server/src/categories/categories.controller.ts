import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    async findAll(): Promise<Category[]> {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    async findOne(@Param('id') id: string): Promise<Category> {
        return this.categoriesService.findOne(parseInt(id));
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@Body() categoryData: Partial<Category>): Promise<Category> {
        return this.categoriesService.create(categoryData);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() categoryData: Partial<Category>): Promise<Category> {
        return this.categoriesService.update(parseInt(id), categoryData);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string): Promise<void> {
        return this.categoriesService.remove(parseInt(id));
    }
}
