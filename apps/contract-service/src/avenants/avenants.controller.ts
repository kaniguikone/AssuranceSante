import {
  Controller, Get, Post, Patch, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AvenantsService } from './avenants.service';
import { CreateAvenantDto, ValiderAvenantDto } from './dto/avenant.dto';

@ApiTags('Avenants')
@Controller('avenants')
export class AvenantsController {
  constructor(private readonly service: AvenantsService) {}

  @Get('contrat/:contratId')
  @ApiOperation({ summary: 'Avenants d\'un contrat' })
  byContrat(@Param('contratId', ParseUUIDPipe) contratId: string) {
    return this.service.findByContrat(contratId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un avenant' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un avenant' })
  create(@Body() dto: CreateAvenantDto) {
    return this.service.create(dto);
  }

  @Patch(':id/valider')
  @ApiOperation({ summary: 'Valider un avenant' })
  valider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValiderAvenantDto,
  ) {
    return this.service.valider(id, dto);
  }
}
