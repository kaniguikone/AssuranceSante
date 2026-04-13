import {
  IsString, IsEnum, IsUUID, IsDateString, IsBoolean,
  IsOptional, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NouveauSouscripteurDto } from './nouveau-souscripteur.dto';

export class CreateContratDto {
  @ApiProperty({ enum: ['INDIVIDUEL', 'FAMILLE', 'COLLECTIF', 'ENTREPRISE'] })
  @IsEnum(['INDIVIDUEL', 'FAMILLE', 'COLLECTIF', 'ENTREPRISE'])
  type: string;

  @ApiPropertyOptional({ description: 'UUID d\'un membre existant à rattacher comme souscripteur' })
  @IsOptional()
  @IsUUID()
  souscripteurId?: string;

  @ApiPropertyOptional({ description: 'Données du nouveau souscripteur à créer (mutuellement exclusif avec souscripteurId)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NouveauSouscripteurDto)
  nouveauSouscripteur?: NouveauSouscripteurDto;

  @ApiPropertyOptional({ description: 'UUID employeur (contrats collectifs)' })
  @IsOptional()
  @IsUUID()
  employeurId?: string;

  @ApiProperty({ description: 'UUID du produit/formule' })
  @IsUUID()
  produitId: string;

  @ApiProperty({
    description: 'Date d\'effet du contrat (max J-30 avant souscription)',
    example: '2024-01-01',
  })
  @IsDateString()
  dateEffet: string;

  @ApiProperty({ description: 'Date d\'échéance annuelle', example: '2024-12-31' })
  @IsDateString()
  dateEcheance: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  estRenouvellementAuto?: boolean;
}
