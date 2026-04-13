import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProduitsService } from './produits.service';

@ApiTags('Produits')
@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les produits actifs' })
  findAll() {
    return this.produitsService.findAll();
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialiser les 4 formules de base (dev uniquement)' })
  seed() {
    return this.produitsService.seed();
  }
}
