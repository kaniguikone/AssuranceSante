import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import type { MobileMoneyPaymentRequest, MobileMoneyPaymentResponse } from './orange-money.provider';

@Injectable()
export class MtnMomoProvider {
  private readonly logger = new Logger(MtnMomoProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async initierPaiement(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.get('MTN_MOMO_BASE_URL');
    const subscriptionKey = this.config.get('MTN_MOMO_SUBSCRIPTION_KEY');
    const referenceId = uuidv4();
    const env = this.config.get('MTN_MOMO_ENVIRONMENT', 'sandbox');

    try {
      await firstValueFrom(
        this.http.post(
          `${baseUrl}/collection/v1_0/requesttopay`,
          {
            amount: String(req.montant),
            currency: 'XOF',
            externalId: req.reference,
            payer: {
              partyIdType: 'MSISDN',
              partyId: req.telephone.replace('+', ''),
            },
            payerMessage: req.description,
            payeeNote: `SANTECI-${req.reference}`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-Reference-Id': referenceId,
              'X-Target-Environment': env,
              'Ocp-Apim-Subscription-Key': subscriptionKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return { statut: 'PENDING', referenceOperateur: referenceId };
    } catch (error) {
      this.logger.error(`MTN MoMo initiation échouée: ${error.message}`);
      throw new BadGatewayException('Erreur communication MTN MoMo');
    }
  }

  async verifierStatut(referenceOperateur: string): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.get('MTN_MOMO_BASE_URL');
    const subscriptionKey = this.config.get('MTN_MOMO_SUBSCRIPTION_KEY');

    const response = await firstValueFrom(
      this.http.get(`${baseUrl}/collection/v1_0/requesttopay/${referenceOperateur}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': this.config.get('MTN_MOMO_ENVIRONMENT', 'sandbox'),
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
      }),
    );

    const statut = response.data.status === 'SUCCESSFUL' ? 'SUCCESS'
      : response.data.status === 'FAILED' ? 'FAILED' : 'PENDING';

    return { statut, referenceOperateur };
  }

  private async getAccessToken(): Promise<string> {
    const baseUrl = this.config.get('MTN_MOMO_BASE_URL');
    const apiUser = this.config.get('MTN_MOMO_API_USER');
    const apiKey = this.config.get('MTN_MOMO_API_KEY');
    const subscriptionKey = this.config.get('MTN_MOMO_SUBSCRIPTION_KEY');
    const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

    const response = await firstValueFrom(
      this.http.post(
        `${baseUrl}/collection/token/`,
        {},
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
          },
        },
      ),
    );

    return response.data.access_token;
  }
}
