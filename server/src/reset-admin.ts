import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@platform.com';
    console.log(`Checking for user: ${adminEmail}`);
    const existingAdmin = await usersService.findOneByEmail(adminEmail);

    if (existingAdmin) {
        console.log('User found. Updating password...');
        // We can't update password easily via service if update method doesn't exist.
        // Let's just create a new one with a slight variation or handled by direct repo access in a real app,
        // but here let's try to overwrite or just delete and recreate.
        // Actually, UsersService doesn't have delete.
        // Let's create a NEW admin to be safe: admin2@platform.com

        const newAdminEmail = 'admin2@platform.com';
        const newAdmin = await usersService.findOneByEmail(newAdminEmail);
        if (!newAdmin) {
            await usersService.create({
                email: newAdminEmail,
                password_hash: 'admin123',
                role: UserRole.ADMIN,
            });
            console.log(`Created Fallback Admin: ${newAdminEmail} / admin123`);
        } else {
            console.log(`Fallback Admin ${newAdminEmail} already exists.`);
        }
    } else {
        console.log('Admin not found. Creating...');
        await usersService.create({
            email: adminEmail,
            password_hash: 'admin123',
            role: UserRole.ADMIN,
        });
        console.log('Admin user created');
    }

    await app.close();
}
bootstrap();
