import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrestatairesService } from './prestataires.service';
import { CreatePrestataireDto, UpdatePrestataireDto } from './dto/prestataire.dto';

@ApiTags('Prestataires')
@Controller('prestataires')
export class PrestatairesController {
  constructor(private readonly svc: PrestatairesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les prestataires' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un prestataire' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un prestataire' })
  create(@Body() dto: CreatePrestataireDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un prestataire' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrestataireDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un prestataire' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
