import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async envoyer(params: {
    telephone: string;
    message: string;
  }): Promise<{ referenceExterne: string; cout: number }> {
    const baseUrl = this.config.get('INFOBIP_BASE_URL');
    const apiKey = this.config.get('INFOBIP_API_KEY');
    const sender = this.config.get('SMS_SENDER_ID', 'SANTECI');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${baseUrl}/sms/2/text/advanced`,
          {
            messages: [{
              destinations: [{ to: params.telephone }],
              from: sender,
              text: params.message,
            }],
          },
          {
            headers: {
              Authorization: `App ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const msgResult = response.data.messages?.[0];
      this.logger.log(`SMS envoyé à ${params.telephone}: ${msgResult?.status?.name}`);

      return {
        referenceExterne: msgResult?.messageId ?? 'unknown',
        cout: parseInt(this.config.get('SMS_COST_FCFA', '35'), 10),
      };
    } catch (error) {
      this.logger.error(`Échec envoi SMS à ${params.telephone}: ${error.message}`);
      throw error;
    }
  }
}
