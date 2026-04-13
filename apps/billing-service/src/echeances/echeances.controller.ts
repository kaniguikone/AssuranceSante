import {
  Controller, Get, Post, Param, Body, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, Min } from 'class-validator';
import { EcheancesService } from './echeances.service';

class GenererEcheancesDto {
  @IsUUID('all') contratId: string;
  @IsUUID('all') membreId: string;
  @IsNumber() @Min(1) primeMensuelle: number;
  @IsString() dateDebut: string;
  @IsString() dateFin: string;
}

class PaiementDto {
  @IsNumber() @Min(1) montantPaye: number;
  @IsString() transactionId: string;
}

@ApiTags('Échéances')
@Controller('echeances')
export class EcheancesController {
  constructor(private readonly echeancesService: EcheancesService) {}

  @Post('generer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Générer les échéances mensuelles d\'un contrat' })
  @ApiBody({ type: GenererEcheancesDto })
  generer(@Body() dto: GenererEcheancesDto) {
    return this.echeancesService.genererEcheancesMensuelles({
      ...dto,
      dateDebut: new Date(dto.dateDebut),
      dateFin: new Date(dto.dateFin),
    });
  }

  @Get('contrat/:contratId')
  @ApiOperation({ summary: 'Échéances d\'un contrat' })
  findByContrat(@Param('contratId', ParseUUIDPipe) contratId: string) {
    return this.echeancesService.findByContrat(contratId);
  }

  @Get('contrat/:contratId/resume')
  @ApiOperation({ summary: 'Résumé financier d\'un contrat (total, payé, restant)' })
  resume(@Param('contratId', ParseUUIDPipe) contratId: string) {
    return this.echeancesService.resume(contratId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une échéance' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.echeancesService.findById(id);
  }

  @Post(':id/paiement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un paiement sur une échéance' })
  paiement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PaiementDto,
  ) {
    return this.echeancesService.enregistrerPaiement(id, dto.montantPaye, dto.transactionId);
  }

  @Post('detecter-impayes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Détecter et marquer les échéances impayées (job quotidien)' })
  detecterImpayes() {
    return this.echeancesService.detecterImpayes();
  }
}
