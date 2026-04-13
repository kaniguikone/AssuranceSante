import {
  Controller, Get, Post, Patch, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContratDto } from './dto/create-contrat.dto';

// TODO Phase 2 : réactiver JwtAuthGuard + Keycloak
const DEV_USER_ID = 'system-dev';

@ApiTags('Contrats')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau contrat' })
  create(@Body() dto: CreateContratDto) {
    return this.contractsService.creer(dto, DEV_USER_ID);
  }

  @Get()
  @ApiOperation({ summary: 'Liste tous les contrats' })
  findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un contrat' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findById(id);
  }

  @Get('souscripteur/:souscripteurId')
  @ApiOperation({ summary: 'Contrats d\'un souscripteur' })
  findBySouscripteur(@Param('souscripteurId', ParseUUIDPipe) id: string) {
    return this.contractsService.findBySouscripteur(id);
  }

  @Patch(':id/activer')
  @ApiOperation({ summary: 'Activer un contrat (passer de EN_ATTENTE à ACTIF)' })
  activer(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.activer(id, DEV_USER_ID);
  }

  @Patch(':id/suspendre')
  @ApiOperation({ summary: 'Suspendre un contrat pour non-paiement' })
  suspendre(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.suspendre(id, DEV_USER_ID);
  }

  @Patch(':id/reactiver')
  @ApiOperation({ summary: 'Réactiver un contrat suspendu (max 60 jours après suspension)' })
  reactiver(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.reactiverApresSuspension(id, DEV_USER_ID);
  }

  @Patch(':id/resilier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Résilier un contrat' })
  resilier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motif') motif: string,
  ) {
    return this.contractsService.resilier(id, motif, DEV_USER_ID);
  }
}
