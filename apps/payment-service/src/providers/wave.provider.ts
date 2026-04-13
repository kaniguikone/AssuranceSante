import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import type { MobileMoneyPaymentRequest, MobileMoneyPaymentResponse } from './orange-money.provider';

@Injectable()
export class WaveProvider {
  private readonly logger = new Logger(WaveProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async initierPaiement(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    const apiKey = this.config.get('WAVE_API_KEY');
    const baseUrl = this.config.get('WAVE_BASE_URL');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${baseUrl}/checkout/sessions`,
          {
            amount: String(req.montant),
            currency: 'XOF',
            error_url: req.callbackUrl,
            success_url: req.callbackUrl,
            client_reference: req.reference,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        statut: 'PENDING',
        referenceOperateur: response.data.id,
        message: response.data.wave_launch_url,
      };
    } catch (error) {
      this.logger.error(`Wave initiation échouée: ${error.message}`);
      throw new BadGatewayException('Erreur communication Wave');
    }
  }

  // Vérification signature webhook Wave
  validerWebhook(payload: string, signature: string): boolean {
    const secret = this.config.get('WAVE_WEBHOOK_SECRET');
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    return expectedSignature === signature;
  }

  async verifierStatut(referenceOperateur: string): Promise<MobileMoneyPaymentResponse> {
    const apiKey = this.config.get('WAVE_API_KEY');
    const baseUrl = this.config.get('WAVE_BASE_URL');

    const response = await firstValueFrom(
      this.http.get(`${baseUrl}/checkout/sessions/${referenceOperateur}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    const statut = response.data.payment_status === 'succeeded' ? 'SUCCESS'
      : response.data.payment_status === 'failed' ? 'FAILED' : 'PENDING';

    return { statut, referenceOperateur };
  }
}
