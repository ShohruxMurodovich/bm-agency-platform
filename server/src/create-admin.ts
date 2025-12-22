import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@platform.com';
    console.log(`Checking for user: ${adminEmail}`);

    const existingAdmin = await usersService.findOneByEmail(adminEmail);

    if (existingAdmin) {
        console.log('✓ Admin user already exists!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: admin123`);
    } else {
        console.log('Creating admin user...');
        await usersService.create({
            email: adminEmail,
            password_hash: 'admin123', // Will be hashed by service
            role: 'admin',
        });
        console.log('✓ Admin user created successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: admin123`);
    }

    await app.close();
}

bootstrap().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
