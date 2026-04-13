import {
  Injectable, UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { RefreshToken } from './refresh-token.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.estActif) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        ressource: 'auth',
        ipAddress,
        statut: 'FAILURE',
        messageErreur: 'Utilisateur inexistant ou inactif',
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Note: En production, la validation du mot de passe se fait via Keycloak
    // Ici on valide le token Keycloak directement
    const tokens = await this.generateTokens(user.id, user.email, user.roles);

    // Sauvegarder le refresh token hashé
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress);

    // Mettre à jour la dernière connexion
    await this.usersService.updateLastLogin(user.id);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ressource: 'auth',
      ipAddress,
      userAgent,
      statut: 'SUCCESS',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenoms: user.prenoms,
        roles: user.roles,
      },
    };
  }

  async refreshTokens(refreshTokenStr: string, ipAddress: string) {
    const tokenHash = this.hashToken(refreshTokenStr);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expireAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.usersService.findById(storedToken.userId);
    if (!user || !user.estActif) {
      throw new UnauthorizedException('Compte inactif');
    }

    // Rotation: révoquer l'ancien token
    await this.refreshTokenRepo.update(storedToken.id, { revokedAt: new Date() });

    const tokens = await this.generateTokens(user.id, user.email, user.roles);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress);

    return tokens;
  }

  async logout(userId: string, refreshTokenStr: string) {
    const tokenHash = this.hashToken(refreshTokenStr);
    await this.refreshTokenRepo.update({ tokenHash }, { revokedAt: new Date() });

    await this.auditService.log({
      userId,
      action: 'LOGOUT',
      ressource: 'auth',
      statut: 'SUCCESS',
    });
  }

  private async generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.config.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.config.get('jwt.refreshExpiresIn'),
        secret: this.config.get('jwt.secret') + '_refresh',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string, ipAddress: string) {
    const tokenHash = this.hashToken(token);
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7); // 7 jours

    await this.refreshTokenRepo.save({
      userId,
      tokenHash,
      expireAt,
      ipAddress,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
