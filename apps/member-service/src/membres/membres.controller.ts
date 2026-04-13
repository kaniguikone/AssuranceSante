import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MembresService } from './membres.service';
import { ImmatriculerMembreDto } from './dto/immatriculer-membre.dto';
import { RechercheMembreDto } from './dto/recherche-membre.dto';

@ApiTags('Membres')
@ApiBearerAuth()
@Controller('membres')
export class MembresController {
  constructor(private readonly membresService: MembresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Immatriculer un nouvel assuré ou bénéficiaire' })
  @ApiResponse({ status: 201, description: 'Membre créé avec carte tiers-payant générée' })
  @ApiResponse({ status: 400, description: 'Données invalides ou âge hors limites' })
  @ApiResponse({ status: 409, description: 'Doublon détecté (NNI ou document déjà enregistré)' })
  immatriculer(@Body() dto: ImmatriculerMembreDto) {
    return this.membresService.immatriculer({
      ...dto,
      dateNaissance: new Date(dto.dateNaissance),
      createdBy: 'system', // TODO: extraire du token JWT
    });
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des membres (avec pagination)' })
  rechercher(@Query() dto: RechercheMembreDto) {
    return this.membresService.rechercher(dto);
  }

  @Get('doublon')
  @ApiOperation({ summary: 'Détecter les doublons phonétiques potentiels' })
  detecterDoublons(
    @Query('nom') nom: string,
    @Query('prenoms') prenoms: string,
    @Query('dateNaissance') dateNaissance: string,
  ) {
    return this.membresService.rechercherDoublonsPublic(nom, prenoms, new Date(dateNaissance));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un membre avec ses cartes' })
  @ApiResponse({ status: 404, description: 'Membre introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.findById(id);
  }

  @Get('contrat/:contratId')
  @ApiOperation({ summary: 'Liste des membres d\'un contrat' })
  findByContrat(@Param('contratId', ParseUUIDPipe) contratId: string) {
    return this.membresService.findByContrat(contratId);
  }

  @Get('carte/:numeroCarte')
  @ApiOperation({ summary: 'Trouver un membre par numéro de carte tiers-payant' })
  findByCarte(@Param('numeroCarte') numeroCarte: string) {
    return this.membresService.findByNumeroCarte(numeroCarte);
  }

  @Post(':id/carte')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Réémettre une carte tiers-payant (perte, expiration)' })
  emettreCarteTP(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.emettreCarteTiersPay(id);
  }

  @Patch(':id/contrat')
  @ApiOperation({ summary: 'Rattacher un membre à un contrat' })
  rattacherContrat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('contratId') contratId: string,
  ) {
    return this.membresService.rattacherContrat(id, contratId);
  }

  @Patch(':id/suspendre')
  @ApiOperation({ summary: 'Suspendre un membre (non-paiement, fraude)' })
  suspendre(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.suspendre(id);
  }

  @Patch(':id/reactiver')
  @ApiOperation({ summary: 'Réactiver un membre suspendu' })
  reactiver(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.reactiver(id);
  }

  @Patch(':id/radier')
  @ApiOperation({ summary: 'Radier définitivement un membre' })
  radier(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.radier(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Suppression physique — compensation transactionnelle uniquement' })
  supprimer(@Param('id', ParseUUIDPipe) id: string) {
    return this.membresService.supprimer(id);
  }
}
