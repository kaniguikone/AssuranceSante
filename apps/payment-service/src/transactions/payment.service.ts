import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { OrangeMoneyProvider } from '../providers/orange-money.provider';
import { MtnMomoProvider } from '../providers/mtn-momo.provider';
import { WaveProvider } from '../providers/wave.provider';
import { identifierOperateur } from '../../../../../libs/utils/src/phone-utils';
import { genererReferenceTransaction } from '../../../../../libs/utils/src/numero-generator';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly orangeMoney: OrangeMoneyProvider,
    private readonly mtnMomo: MtnMomoProvider,
    private readonly wave: WaveProvider,
  ) {}

  async initierPaiementCotisation(params: {
    montant: number;
    telephone: string;
    echeanceId: string;
    payeurId: string;
    callbackUrl: string;
  }): Promise<Transaction> {
    const operateur = this.detecterOperateur(params.telephone);
    const reference = genererReferenceTransaction();

    const transaction = this.transactionRepo.create({
      reference,
      type: 'COTISATION',
      operateur,
      montant: params.montant,
      frais: 0,
      montantNet: params.montant,
      devise: 'XOF',
      statut: 'INITIEE',
      payeurId: params.payeurId,
      echeanceId: params.echeanceId,
      numerotelephone: params.telephone,
    });
    await this.transactionRepo.save(transaction);

    try {
      const result = await this.initierAvecOperateur(operateur, {
        montant: params.montant,
        telephone: params.telephone,
        reference,
        description: `Cotisation assurance maladie - SANTÉ-CI`,
        callbackUrl: params.callbackUrl,
      });

      await this.transactionRepo.update(transaction.id, {
        statut: 'EN_ATTENTE',
        referenceOperateur: result.referenceOperateur,
      });

      return this.transactionRepo.findOne({ where: { id: transaction.id } });
    } catch (error) {
      await this.transactionRepo.update(transaction.id, { statut: 'ECHOUEE' });
      throw error;
    }
  }

  async traiterWebhook(operateur: string, payload: Record<string, unknown>): Promise<void> {
    const reference = this.extraireReferenceDepuisWebhook(operateur, payload);
    if (!reference) return;

    const transaction = await this.transactionRepo.findOne({
      where: { referenceOperateur: reference },
    });
    if (!transaction) return;

    const statutFinal = this.determinerStatutFinalWebhook(operateur, payload);
    await this.transactionRepo.update(transaction.id, {
      statut: statutFinal,
      webhookRecu: true,
      webhookData: payload,
      webhookAt: new Date(),
    });

    this.logger.log(`Transaction ${transaction.reference} : ${statutFinal}`);
    // TODO: Publier événement Kafka pour notifier billing-service / notification-service
  }

  private detecterOperateur(telephone: string): string {
    const op = identifierOperateur(telephone);
    const map: Record<string, string> = {
      ORANGE: 'ORANGE_MONEY',
      MTN: 'MTN_MOMO',
      WAVE: 'WAVE',
      MOOV: 'MOOV_MONEY',
    };
    if (!map[op]) throw new BadRequestException(`Opérateur inconnu pour le numéro ${telephone}`);
    return map[op];
  }

  private async initierAvecOperateur(operateur: string, req: any) {
    switch (operateur) {
      case 'ORANGE_MONEY': return this.orangeMoney.initierPaiement(req);
      case 'MTN_MOMO': return this.mtnMomo.initierPaiement(req);
      case 'WAVE': return this.wave.initierPaiement(req);
      default: throw new BadRequestException(`Opérateur non supporté: ${operateur}`);
    }
  }

  private extraireReferenceDepuisWebhook(operateur: string, payload: Record<string, unknown>): string | null {
    switch (operateur) {
      case 'orange_money': return payload.pay_token as string;
      case 'mtn_momo': return payload.referenceId as string;
      case 'wave': return (payload.checkout_session as any)?.id;
      default: return null;
    }
  }

  private determinerStatutFinalWebhook(operateur: string, payload: Record<string, unknown>): string {
    switch (operateur) {
      case 'orange_money': return payload.status === 'SUCCESS' ? 'CONFIRMEE' : 'ECHOUEE';
      case 'mtn_momo': return payload.status === 'SUCCESSFUL' ? 'CONFIRMEE' : 'ECHOUEE';
      case 'wave': return (payload as any).payment_status === 'succeeded' ? 'CONFIRMEE' : 'ECHOUEE';
      default: return 'ECHOUEE';
    }
  }
}
