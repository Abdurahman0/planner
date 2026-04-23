import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/auth-user';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('Unable to register with these credentials');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        subscriptionPlan: SubscriptionPlan.free,
      },
      select: this.safeUserSelect,
    });

    return {
      accessToken: await this.signAccessToken(user.id, user.email),
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
    };

    return {
      accessToken: await this.signAccessToken(user.id, user.email),
      user: safeUser,
    };
  }

  private signAccessToken(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }

  private readonly safeUserSelect = {
    id: true,
    email: true,
    subscriptionPlan: true,
  } as const;
}
