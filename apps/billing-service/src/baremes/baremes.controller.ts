import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsInt, Min } from 'class-validator';
import { BaremesService } from './baremes.service';

export class SimulerPrimeDto {
  @ApiProperty({ example: 'ARGENT' }) @IsString() formule: string;
  @ApiProperty({ example: '1985-03-15' }) @IsDateString() dateNaissance: string;
  @ApiProperty({ required: false, example: 2 }) @IsOptional() @IsInt() @Min(0) nbBeneficiaires?: number;
}

@ApiTags('Barèmes')
@Controller('baremes')
export class BaremesController {
  constructor(private readonly baremesService: BaremesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les barèmes actifs' })
  findAll() {
    return this.baremesService.findAll();
  }

  @Post('simuler')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simuler la prime mensuelle pour une formule et un âge donnés' })
  simuler(@Body() dto: SimulerPrimeDto) {
    return this.baremesService.simuler(dto);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialiser les barèmes de base par formule et âge (dev uniquement)' })
  seed() {
    return this.baremesService.seed();
  }
}
