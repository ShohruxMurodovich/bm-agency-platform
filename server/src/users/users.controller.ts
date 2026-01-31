import { Controller, Get, Post, Body, UseGuards, Delete, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcryptjs';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@Body() body: any) {
        // Hash the password before creating the user
        const password_hash = await bcrypt.hash(body.password, 10);

        return this.usersService.create({
            ...body,
            password_hash
        });
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() body: any) {
        // Sanitization: Only allow specific fields
        const updateData: Partial<User> = {};

        if (body.email) updateData.email = body.email;
        if (body.role) updateData.role = body.role;

        if (body.password && body.password.length > 0) {
            updateData.password_hash = body.password;
        }

        return this.usersService.update(id, updateData);
    }
}
