import {
  Controller, Get, Post, Patch, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { SinistresService } from './sinistres.service';
import { DeposerSinistreDto, LiquiderSinistreDto, RejeterSinistreDto } from './dto/deposer-sinistre.dto';

class MarquerFraudeDto {
  @ApiProperty({ minimum: 0, maximum: 100 }) @IsNumber() @Min(0) @Max(100) scoreFraude: number;
  @ApiProperty({ example: 'ELEVE' }) @IsString() niveauSuspicion: string;
}

class CloturerFraudeDto {
  @ApiProperty({ enum: ['FRAUDE_CONFIRMEE', 'FRAUDE_INFIRMEE'] })
  @IsEnum(['FRAUDE_CONFIRMEE', 'FRAUDE_INFIRMEE']) decision: 'FRAUDE_CONFIRMEE' | 'FRAUDE_INFIRMEE';
  @ApiProperty({ required: false }) @IsOptional() @IsString() commentaire?: string;
}

const DEV_USER_ID = 'system-dev';

@ApiTags('Sinistres')
@Controller('sinistres')
export class SinistresController {
  constructor(private readonly sinistresService: SinistresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Déposer un sinistre (demande de remboursement)' })
  deposer(@Body() dto: DeposerSinistreDto) {
    return this.sinistresService.deposer({
      ...dto,
      dateSoin: new Date(dto.dateSoin),
      dateEffetContrat: new Date(dto.dateEffetContrat),
      actesMedicaux: [],
      documentUrls: dto.documentUrls ?? [],
      userId: DEV_USER_ID,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Liste tous les sinistres' })
  findAll() {
    return this.sinistresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un sinistre' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sinistresService.findById(id);
  }

  @Get('membre/:membreId')
  @ApiOperation({ summary: 'Sinistres d\'un membre' })
  findByMembre(@Param('membreId', ParseUUIDPipe) membreId: string) {
    return this.sinistresService.findByMembre(membreId);
  }

  @Get('fraude/alertes')
  @ApiOperation({ summary: 'Sinistres avec suspicion de fraude (score ≥ 50)' })
  alertesFraude() {
    return this.sinistresService.findEnAttenteFraude();
  }

  @Patch(':id/approuver')
  @ApiOperation({ summary: 'Approuver un sinistre pour liquidation' })
  approuver(@Param('id', ParseUUIDPipe) id: string) {
    return this.sinistresService.approuver(id, DEV_USER_ID);
  }

  @Patch(':id/rejeter')
  @ApiOperation({ summary: 'Rejeter un sinistre avec motif' })
  rejeter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejeterSinistreDto,
  ) {
    return this.sinistresService.rejeter(id, dto.motif, DEV_USER_ID);
  }

  @Patch(':id/liquider')
  @ApiOperation({ summary: 'Liquider un sinistre approuvé (calcul remboursement)' })
  liquider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LiquiderSinistreDto,
  ) {
    return this.sinistresService.liquider(id, { ...dto, userId: DEV_USER_ID });
  }

  @Patch(':id/fraude/marquer')
  @ApiOperation({ summary: 'Marquer un sinistre comme fraude suspectée' })
  marquerFraude(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarquerFraudeDto,
  ) {
    return this.sinistresService.marquerFraude(id, { ...dto, userId: DEV_USER_ID });
  }

  @Patch(':id/fraude/cloturer')
  @ApiOperation({ summary: 'Clôturer une enquête fraude (confirmer ou infirmer)' })
  cloturerFraude(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloturerFraudeDto,
  ) {
    return this.sinistresService.cloturerEnqueteFraude(id, { ...dto, userId: DEV_USER_ID });
  }
}
