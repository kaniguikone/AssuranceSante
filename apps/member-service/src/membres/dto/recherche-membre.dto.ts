import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RechercheMembreDto {
  @ApiPropertyOptional({ description: 'Recherche par nom (partiel, insensible à la casse)' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ description: 'Recherche par prénom' })
  @IsOptional()
  @IsString()
  prenoms?: string;

  @ApiPropertyOptional({ description: 'Numéro de carte assuré' })
  @IsOptional()
  @IsString()
  numeroCarte?: string;

  @ApiPropertyOptional({ description: 'Numéro de téléphone' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ description: 'NNI (identifiant national)' })
  @IsOptional()
  @IsString()
  nni?: string;

  @ApiPropertyOptional({ description: 'UUID du contrat' })
  @IsOptional()
  @IsUUID()
  contratId?: string;

  @ApiPropertyOptional({ enum: ['ACTIF', 'SUSPENDU', 'RADIE'] })
  @IsOptional()
  @IsEnum(['ACTIF', 'SUSPENDU', 'RADIE'])
  statut?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
