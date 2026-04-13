import {
  Controller, Get, Post, Patch, Param, Body,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { EnvoyerNotificationDto } from './dto/envoyer-notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envoyer une notification (SMS, Email, Push)' })
  envoyer(@Body() dto: EnvoyerNotificationDto) {
    return this.notificationsService.envoyer({
      ...dto,
      emailDest: dto.emailDest,
    });
  }

  @Get('destinataire/:id')
  @ApiOperation({ summary: 'Historique des notifications d\'un destinataire' })
  findByDestinataire(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findByDestinataire(id);
  }

  @Get('en-attente')
  @ApiOperation({ summary: 'Notifications en attente d\'envoi' })
  findEnAttente() {
    return this.notificationsService.findEnAttente();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une notification' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id/lue')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  marquerLue(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.marquerLue(id);
  }
}
