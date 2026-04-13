import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produit } from './produit.entity';
import { ProduitsController } from './produits.controller';
import { ProduitsService } from './produits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Produit])],
  controllers: [ProduitsController],
  providers: [ProduitsService],
  exports: [ProduitsService],
})
export class ProduitsModule {}
