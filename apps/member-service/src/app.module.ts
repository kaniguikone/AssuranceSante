import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { MembresModule } from './membres/membres.module';
import { Membre } from './membres/membre.entity';
import { CarteTiersPay } from './cartes/carte-tiers-pay.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST') ?? config.get('POSTGRES_HOST') ?? 'localhost',
        port: parseInt(config.get('DB_PORT') ?? config.get('POSTGRES_PORT') ?? '5432'),
        username: config.get('POSTGRES_USER') ?? 'sante_ci',
        password: config.get('POSTGRES_PASSWORD') ?? 'sante_ci_dev',
        database: config.get('DB_NAME') ?? 'sante_member',
        entities: [Membre, CarteTiersPay],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ThrottlerModule.forRoot([
      { name: 'default', ttl: 900000, limit: 200 },
    ]),

    MembresModule,
  ],
})
export class AppModule {}
