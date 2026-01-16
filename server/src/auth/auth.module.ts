import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        UsersModule,
        SellersModule,
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'secretKey',
                signOptions: { expiresIn: '24h' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule { }
