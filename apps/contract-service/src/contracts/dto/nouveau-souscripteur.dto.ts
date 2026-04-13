import {
  IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsDateString, Length, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NouveauSouscripteurDto {
  @ApiProperty({ enum: ['CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE'] })
  @IsEnum(['CNI', 'PASSEPORT', 'TITRE_SEJOUR', 'PERMIS_CONDUIRE'])
  typeDocument: string;

  @ApiProperty({ example: 'CI0123456789' })
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

  @ApiProperty({ example: '1985-03-15' })
  @IsDateString()
  dateNaissance: string;

  @ApiProperty({ enum: ['M', 'F'] })
  @IsString()
  @Length(1, 1)
  genre: string;

  @ApiProperty({ example: '+2250700000000' })
  @IsString()
  @Matches(/^(\+225|00225)?[\d\s\-\.]{8,13}$/, { message: 'Numéro de téléphone CI invalide' })
  telephone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Cocody' })
  @IsString()
  @IsNotEmpty()
  adresseCommune: string;
}
