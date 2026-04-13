import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MobileMoneyPaymentRequest {
  montant: number;
  telephone: string;
  reference: string;
  description: string;
  callbackUrl: string;
}

export interface MobileMoneyPaymentResponse {
  statut: 'SUCCESS' | 'PENDING' | 'FAILED';
  referenceOperateur: string;
  message?: string;
}

@Injectable()
export class OrangeMoneyProvider {
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  private accessToken: string | null = null;
  private tokenExpireAt: Date | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async initierPaiement(req: MobileMoneyPaymentRequest): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.get('ORANGE_MONEY_BASE_URL');

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${baseUrl}/webpayment`,
          {
            merchant_key: this.config.get('ORANGE_MONEY_MERCHANT_KEY'),
            currency: 'XOF',
            order_id: req.reference,
            amount: req.montant,
            return_url: req.callbackUrl,
            cancel_url: req.callbackUrl,
            notif_url: req.callbackUrl,
            lang: 'fr',
            reference: req.description,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        statut: 'PENDING',
        referenceOperateur: response.data.pay_token,
        message: response.data.message,
      };
    } catch (error) {
      this.logger.error(`Orange Money initiation échouée: ${error.message}`);
      throw new BadGatewayException('Erreur communication Orange Money');
    }
  }

  async verifierStatut(referenceOperateur: string): Promise<MobileMoneyPaymentResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.get('ORANGE_MONEY_BASE_URL');

    try {
      const response = await firstValueFrom(
        this.http.get(`${baseUrl}/transactionstatus?order_id=${referenceOperateur}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const statut = response.data.status === 'SUCCESS' ? 'SUCCESS'
        : response.data.status === 'FAILED' ? 'FAILED' : 'PENDING';

      return { statut, referenceOperateur };
    } catch (error) {
      this.logger.error(`Vérification statut Orange Money échouée: ${error.message}`);
      throw new BadGatewayException('Erreur vérification statut Orange Money');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpireAt && this.tokenExpireAt > new Date()) {
      return this.accessToken;
    }

    const clientId = this.config.get('ORANGE_MONEY_CLIENT_ID');
    const clientSecret = this.config.get('ORANGE_MONEY_CLIENT_SECRET');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.http.post(
        'https://api.orange.com/oauth/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    this.accessToken = response.data.access_token;
    this.tokenExpireAt = new Date(Date.now() + response.data.expires_in * 1000 - 60000);
    return this.accessToken;
  }
}
