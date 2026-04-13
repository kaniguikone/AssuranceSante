import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinistresModule } from './sinistres/sinistres.module';
import { PrestatairesModule } from './prestataires/prestataires.module';
import { Sinistre } from './sinistres/sinistre.entity';
import { Prestataire } from './prestataires/prestataire.entity';

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
        database: config.get('DB_NAME') ?? 'sante_claim',
        entities: [Sinistre, Prestataire],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: false,
      }),
    }),
    SinistresModule,
    PrestatairesModule,
  ],
})
export class AppModule {}
