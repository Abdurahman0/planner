import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMe(currentUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
