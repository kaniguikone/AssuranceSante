import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ContractsModule } from './contracts/contracts.module';
import { ProduitsModule } from './produits/produits.module';
import { AvenantsModule } from './avenants/avenants.module';
import { Contrat } from './contracts/contrat.entity';
import { Avenant } from './avenants/avenant.entity';
import { Produit } from './produits/produit.entity';

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
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'sante_ci'),
        password: config.get('POSTGRES_PASSWORD', 'sante_ci_dev'),
        database: config.get('DB_CONTRACT', 'sante_contract'),
        entities: [Contrat, Avenant, Produit],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
      }),
    }),
    ContractsModule,
    ProduitsModule,
    AvenantsModule,
  ],
})
export class AppModule {}
