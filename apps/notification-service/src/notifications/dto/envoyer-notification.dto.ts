import {
  IsString, IsEnum, IsUUID, IsOptional, IsEmail, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CanalNotification {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

export enum TypeNotification {
  BIENVENUE = 'BIENVENUE',
  RAPPEL_ECHEANCE = 'RAPPEL_ECHEANCE',
  SUSPENSION = 'SUSPENSION',
  REACTIVATION = 'REACTIVATION',
  RESILIATION = 'RESILIATION',
  RENOUVELLEMENT = 'RENOUVELLEMENT',
  SINISTRE_RECU = 'SINISTRE_RECU',
  SINISTRE_APPROUVE = 'SINISTRE_APPROUVE',
  SINISTRE_REJETE = 'SINISTRE_REJETE',
  REMBOURSEMENT_EFFECTUE = 'REMBOURSEMENT_EFFECTUE',
  PAIEMENT_CONFIRME = 'PAIEMENT_CONFIRME',
  PAIEMENT_ECHOUE = 'PAIEMENT_ECHOUE',
  RELANCE_PAIEMENT = 'RELANCE_PAIEMENT',
  RAPPEL_VACCINATION = 'RAPPEL_VACCINATION',
}

export class EnvoyerNotificationDto {
  @ApiProperty() @IsUUID('all') destinataireId: string;
  @ApiProperty({ enum: TypeNotification }) @IsEnum(TypeNotification) type: TypeNotification;
  @ApiProperty({ enum: CanalNotification }) @IsEnum(CanalNotification) canal: CanalNotification;
  @ApiPropertyOptional({ example: '+2250700000000' }) @IsOptional() @IsString() telephone?: string;
  @ApiPropertyOptional({ example: 'membre@email.ci' }) @IsOptional() @IsEmail() emailDest?: string;
  @ApiPropertyOptional({ example: { nom: 'Koné', montant: '15000' } }) @IsOptional() @IsObject() variables?: Record<string, string>;
}
