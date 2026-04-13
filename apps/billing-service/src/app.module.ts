import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EcheancesModule } from './echeances/echeances.module';
import { BaremesModule } from './baremes/baremes.module';
import { Echeance } from './echeances/echeance.entity';
import { Bareme } from './baremes/bareme.entity';

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
        database: config.get('DB_NAME') ?? 'sante_billing',
        entities: [Echeance, Bareme],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: false,
      }),
    }),

    EcheancesModule,
    BaremesModule,
  ],
})
export class AppModule {}
