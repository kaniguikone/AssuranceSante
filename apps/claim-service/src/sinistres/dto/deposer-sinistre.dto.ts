import {
  IsString, IsEnum, IsUUID, IsDateString, IsNumber, IsArray,
  IsOptional, Min, ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeSoin {
  SOINS_AMBULATOIRES = 'SOINS_AMBULATOIRES',
  MEDICAMENTS = 'MEDICAMENTS',
  HOSPITALISATION_PLANIFIEE = 'HOSPITALISATION_PLANIFIEE',
  HOSPITALISATION_URGENCE = 'HOSPITALISATION_URGENCE',
  ACTES_DENTAIRES = 'ACTES_DENTAIRES',
  OPTIQUE = 'OPTIQUE',
  ANALYSES = 'ANALYSES',
  RADIOLOGIE = 'RADIOLOGIE',
}

export enum ModeDepot {
  SCAN = 'SCAN',
  PHOTO = 'PHOTO',
  SAISIE_MANUELLE = 'SAISIE_MANUELLE',
  TIERS_PAYANT = 'TIERS_PAYANT',
}

export class DeposerSinistreDto {
  @ApiProperty() @IsUUID('all') contratId: string;
  @ApiProperty() @IsUUID('all') membreId: string;
  @ApiProperty() @IsUUID('all') prestataireId: string;
  @ApiProperty({ enum: TypeSoin }) @IsEnum(TypeSoin) typeSoin: TypeSoin;
  @ApiProperty({ enum: ModeDepot }) @IsEnum(ModeDepot) modeDepot: ModeDepot;
  @ApiProperty({ example: '2026-04-10' }) @IsDateString() dateSoin: string;
  @ApiProperty({ example: '2026-04-01' }) @IsDateString() dateEffetContrat: string;
  @ApiProperty({ example: 25000 }) @IsNumber() @Min(1) montantReclame: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) documentUrls?: string[];
}

export class LiquiderSinistreDto {
  @ApiProperty({ example: 5000 }) @IsNumber() @Min(0) franchise: number;
  @ApiProperty({ example: 60 }) @IsNumber() @Min(0) tauxRemboursement: number;
  @ApiProperty({ example: 500000 }) @IsNumber() @Min(0) plafondAnnuelRestant: number;
  @ApiPropertyOptional() @IsOptional() @IsString() commentairesMedecin?: string;
}

export class RejeterSinistreDto {
  @ApiProperty({ example: 'Document insuffisant' }) @IsString() motif: string;
}
