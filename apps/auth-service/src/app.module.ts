import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { appConfig, databaseConfig, jwtConfig } from './config';
import { User } from './users/user.entity';
import { UserRoleEntity } from './roles/user-role.entity';
import { AuditLog } from './audit/audit-log.entity';
import { RefreshToken } from './auth/refresh-token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['../../.env', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [User, UserRoleEntity, AuditLog, RefreshToken],
        synchronize: config.get('app.env') === 'development',
        logging: config.get('app.env') === 'development',
        ssl: config.get('app.env') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),

    // Rate limiting: 100 requêtes / 15 minutes par IP
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 900000, limit: 100 },
      { name: 'auth', ttl: 300000, limit: 10 }, // Plus strict pour /login
    ]),

    AuthModule,
    UsersModule,
    AuditModule,
  ],
})
export class AppModule {}
