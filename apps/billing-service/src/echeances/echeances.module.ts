import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Echeance } from './echeance.entity';
import { Bareme } from '../baremes/bareme.entity';
import { EcheancesController } from './echeances.controller';
import { EcheancesService } from './echeances.service';

@Module({
  imports: [TypeOrmModule.forFeature([Echeance, Bareme])],
  controllers: [EcheancesController],
  providers: [EcheancesService],
  exports: [EcheancesService],
})
export class EcheancesModule {}
