import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@platform.com';
    const existingAdmin = await usersService.findOneByEmail(adminEmail);

    if (!existingAdmin) {
        console.log('Creating Admin user...');
        await usersService.create({
            email: adminEmail,
            password_hash: 'admin123', // Will be hashed by service
            role: UserRole.ADMIN,
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    await app.close();
}
bootstrap();
