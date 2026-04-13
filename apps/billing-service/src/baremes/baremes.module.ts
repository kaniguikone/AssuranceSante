import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bareme } from './bareme.entity';
import { BaremesController } from './baremes.controller';
import { BaremesService } from './baremes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bareme])],
  controllers: [BaremesController],
  providers: [BaremesService],
  exports: [BaremesService],
})
export class BaremesModule {}
