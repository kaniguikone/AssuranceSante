import {
  IsString, IsEnum, IsOptional, IsBoolean, IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypePrestataire } from '../prestataire.entity';

export class CreatePrestataireDto {
  @ApiProperty({ example: 'Clinique Sainte Marie' })
  @IsString()
  nom: string;

  @ApiProperty({ enum: TypePrestataire, example: TypePrestataire.CLINIQUE })
  @IsEnum(TypePrestataire)
  type: TypePrestataire;

  @ApiPropertyOptional({ example: 'Rue des Jardins, Cocody' })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ example: '+2252722000000' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'contact@clinique-sm.ci' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdatePrestataireDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ enum: TypePrestataire })
  @IsOptional()
  @IsEnum(TypePrestataire)
  type?: TypePrestataire;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
