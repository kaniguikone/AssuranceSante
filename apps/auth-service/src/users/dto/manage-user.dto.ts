import {
  IsEmail, IsString, IsOptional, IsBoolean, IsArray, IsEnum, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  GESTIONNAIRE = 'GESTIONNAIRE',
  MEDECIN_CONSEIL = 'MEDECIN_CONSEIL',
  AUDITEUR = 'AUDITEUR',
  AGENT_SAISIE = 'AGENT_SAISIE',
}

export class CreateUserDto {
  @ApiProperty({ example: 'agent@sante-ci.ci' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'KONÉ' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Aboubakar' })
  @IsString()
  prenoms: string;

  @ApiPropertyOptional({ example: '+2250701234567' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true, example: [UserRole.GESTIONNAIRE] })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prenoms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
