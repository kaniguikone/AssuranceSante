import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avenant } from './avenant.entity';
import { AvenantsController } from './avenants.controller';
import { AvenantsService } from './avenants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Avenant])],
  controllers: [AvenantsController],
  providers: [AvenantsService],
  exports: [AvenantsService],
})
export class AvenantsModule {}
