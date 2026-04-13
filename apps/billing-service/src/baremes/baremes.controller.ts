import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaremesService } from './baremes.service';

@ApiTags('Barèmes')
@Controller('baremes')
export class BaremesController {
  constructor(private readonly baremesService: BaremesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les barèmes actifs' })
  findAll() {
    return this.baremesService.findAll();
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialiser les barèmes de base par formule et âge (dev uniquement)' })
  seed() {
    return this.baremesService.seed();
  }
}
