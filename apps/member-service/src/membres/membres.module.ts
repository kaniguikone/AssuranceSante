import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembresController } from './membres.controller';
import { MembresService } from './membres.service';
import { Membre } from './membre.entity';
import { CarteTiersPay } from '../cartes/carte-tiers-pay.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membre, CarteTiersPay])],
  controllers: [MembresController],
  providers: [MembresService],
  exports: [MembresService],
})
export class MembresModule {}
