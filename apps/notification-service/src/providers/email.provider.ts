import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async envoyer(params: {
    to: string;
    sujet: string;
    htmlBody: string;
    textBody?: string;
  }): Promise<{ referenceExterne: string }> {
    const apiKey = this.config.get('SENDGRID_API_KEY');
    const from = this.config.get('EMAIL_FROM', 'noreply@sante-ci.ci');
    const fromName = this.config.get('EMAIL_FROM_NAME', 'SANTÉ-CI');

    try {
      const response = await firstValueFrom(
        this.http.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [{ to: [{ email: params.to }] }],
            from: { email: from, name: fromName },
            subject: params.sujet,
            content: [
              { type: 'text/html', value: params.htmlBody },
              ...(params.textBody ? [{ type: 'text/plain', value: params.textBody }] : []),
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const messageId = response.headers['x-message-id'] ?? 'unknown';
      this.logger.log(`Email envoyé à ${params.to}: ${messageId}`);
      return { referenceExterne: messageId };
    } catch (error) {
      this.logger.error(`Échec envoi email à ${params.to}: ${error.message}`);
      throw error;
    }
  }
}
