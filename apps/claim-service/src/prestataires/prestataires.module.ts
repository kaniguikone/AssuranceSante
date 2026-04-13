import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestataire } from './prestataire.entity';
import { PrestatairesService } from './prestataires.service';
import { PrestatairesController } from './prestataires.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prestataire])],
  controllers: [PrestatairesController],
  providers: [PrestatairesService],
  exports: [PrestatairesService],
})
export class PrestatairesModule {}
