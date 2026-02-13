import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for path-based routing
  app.setGlobalPrefix('api');

  // Secure CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  // Log all requests to debug health checks
  app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url} from ${req.ip}`);
    // Safe header logging (mask token)
    const safeHeaders = { ...req.headers };
    if (safeHeaders.authorization) {
      safeHeaders.authorization = `${safeHeaders.authorization.substring(0, 15)}...`;
    }
    console.log('Headers:', JSON.stringify(safeHeaders));
    res.on('finish', () => {
      console.log(`Response: ${req.method} ${req.url} ${res.statusCode}`);
    });
    next();
  });

  // Global validation pipe for input validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter for error handling
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('BM Agency Platform API')
    .setDescription('Internal API for BM Agency Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Bootstrap Admin User
  const usersService = app.get(UsersService);
  const adminEmail = 'admin@platform.com';
  const existingAdmin = await usersService.findOneByEmail(adminEmail);

  if (!existingAdmin) {
    console.log('⚠️ Admin user not found. Creating default admin...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await usersService.create({
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin',
      name: 'Platform Admin',
      // No subscription/trial for super admin
    });
    console.log('✅ Default Admin User created: admin@platform.com / admin123');
  } else {
    console.log('✅ Admin user check passed.');
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
