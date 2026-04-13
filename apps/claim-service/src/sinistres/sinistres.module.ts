import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sinistre } from './sinistre.entity';
import { SinistresService } from './sinistres.service';
import { SinistresController } from './sinistres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sinistre])],
  controllers: [SinistresController],
  providers: [SinistresService],
  exports: [SinistresService],
})
export class SinistresModule {}
