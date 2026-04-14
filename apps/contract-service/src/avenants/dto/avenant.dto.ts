import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeAvenant {
  CHANGEMENT_FORMULE     = 'CHANGEMENT_FORMULE',
  AJOUT_BENEFICIAIRE     = 'AJOUT_BENEFICIAIRE',
  RETRAIT_BENEFICIAIRE   = 'RETRAIT_BENEFICIAIRE',
  CHANGEMENT_COORDONNEES = 'CHANGEMENT_COORDONNEES',
  MODIFICATION_FRANCHISE = 'MODIFICATION_FRANCHISE',
  AUTRE                  = 'AUTRE',
}

export class CreateAvenantDto {
  @ApiProperty() @IsString() contratId: string;
  @ApiProperty({ enum: TypeAvenant }) @IsEnum(TypeAvenant) type: TypeAvenant;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsDateString() dateEffet: string;
  @ApiProperty() @IsNumber() primeAvant: number;
  @ApiProperty() @IsNumber() primeApres: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() validationRequise?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() documentUrl?: string;
}

export class ValiderAvenantDto {
  @ApiProperty() @IsString() validePar: string;
  @ApiPropertyOptional() @IsOptional() @IsString() validePar2?: string;
}
