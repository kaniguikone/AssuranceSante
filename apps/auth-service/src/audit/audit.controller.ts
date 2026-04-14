import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller('audit')
@Public()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Dernières entrées du journal d\'audit' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('limit') limit?: number) {
    return this.auditService.findAll(limit ? Number(limit) : 100);
  }

  @Get(':ressource/:id')
  @ApiOperation({ summary: 'Journal d\'audit pour une ressource donnée (contrat, sinistre, membre…)' })
  byRessource(
    @Param('ressource') ressource: string,
    @Param('id') id: string,
  ) {
    return this.auditService.findByRessource(ressource, id);
  }
}
