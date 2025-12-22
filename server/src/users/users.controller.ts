import { Controller, Get, Post, Body, UseGuards, Delete, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() body: any) {
        // Map frontend "password" to "password_hash" because service expects it,
        // (actually service logic handles hashing, so we just pass data)
        // But service expects `password_hash` property in `userData`.
        // Let's adjust service slightly or map here.
        // My service `create` takes `userData` and hashes `password_hash`.
        // Wait, looking at service: `const passwordToHash = userData.password_hash || ...`.
        // So I should pass the plain text password as `password_hash` to the service? 
        // Or better, let's just pass it.
        return this.usersService.create({
            ...body,
            password_hash: body.password // Mapping 'password' input to field expected by logic
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
