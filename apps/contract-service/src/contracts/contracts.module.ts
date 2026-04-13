import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Contrat } from './contrat.entity';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Produit } from '../produits/produit.entity';
import { Avenant } from '../avenants/avenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contrat, Produit, Avenant]),
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
      }),
    }),
  ],
  controllers: [ContractsController],
  providers: [ContractsService, JwtAuthGuard],
  exports: [ContractsService],
})
export class ContractsModule {}
