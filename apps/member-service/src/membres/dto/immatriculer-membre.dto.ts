import {
  IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum,
  IsDateString, IsBoolean, IsUUID, Length, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeDocument {
  CNI = 'CNI',
  PASSEPORT = 'PASSEPORT',
  TITRE_SEJOUR = 'TITRE_SEJOUR',
  PERMIS_CONDUIRE = 'PERMIS_CONDUIRE',
}

export enum LienParente {
  PRINCIPAL = 'PRINCIPAL',
  CONJOINT = 'CONJOINT',
  ENFANT = 'ENFANT',
  AUTRE = 'AUTRE',
}

export class ImmatriculerMembreDto {
  @ApiPropertyOptional({ description: 'Numéro National d\'Identification (SNEDAI)' })
  @IsOptional()
  @IsString()
  nni?: string;

  @ApiProperty({ enum: TypeDocument, example: TypeDocument.CNI })
  @IsEnum(TypeDocument)
  typeDocument: TypeDocument;

  @ApiProperty({ description: 'Numéro du document d\'identité', example: 'CI0123456789' })
  @IsString()
  @IsNotEmpty()
  numeroDocument: string;

  @ApiProperty({ example: 'KONÉ' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'Aboubakar' })
  @IsString()
  @IsNotEmpty()
  prenoms: string;

  @ApiProperty({ example: '1985-03-15', description: 'Format YYYY-MM-DD' })
  @IsDateString()
  dateNaissance: string;

  @ApiProperty({ enum: ['M', 'F'], example: 'M' })
  @IsString()
  @Length(1, 1)
  genre: string;

  @ApiPropertyOptional({ example: 'Ivoirienne' })
  @IsOptional()
  @IsString()
  nationalite?: string;

  @ApiProperty({ example: '0701234567', description: 'Numéro CI (10 chiffres)' })
  @IsString()
  @Matches(/^(\+225|00225)?[\d\s\-\.]{8,13}$/, { message: 'Numéro de téléphone CI invalide' })
  telephone: string;

  @ApiPropertyOptional({ example: '0501234567' })
  @IsOptional()
  @IsString()
  telephoneSecondaire?: string;

  @ApiPropertyOptional({ example: 'aboubakarkone@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Cocody' })
  @IsString()
  @IsNotEmpty()
  adresseCommune: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  adresseVille?: string;

  @ApiPropertyOptional({ example: 'Angré' })
  @IsOptional()
  @IsString()
  adresseQuartier?: string;

  @ApiPropertyOptional({ description: 'UUID du contrat d\'assurance (optionnel à la création)' })
  @IsOptional()
  @IsUUID('all')
  contratId?: string;

  @ApiPropertyOptional({ enum: LienParente, default: LienParente.PRINCIPAL })
  @IsOptional()
  @IsEnum(LienParente)
  lienParente?: LienParente;

  @ApiPropertyOptional({ description: 'UUID du membre principal (pour les bénéficiaires)' })
  @IsOptional()
  @IsUUID('all')
  membrePrincipalId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  estEtudiant?: boolean;

  @ApiPropertyOptional({ example: 'Université FHB' })
  @IsOptional()
  @IsString()
  etablissementScolaire?: string;
}
