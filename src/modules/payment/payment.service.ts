import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreatePaymentDto) {
    const { roundId, amount } = dto;

    const round = await this.prisma.round.findUnique({
      where: {
        id: roundId,
      },
      include: {
        gap: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Round topilmadi');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User topilmadi');
    }

    const member = await this.prisma.gapMember.findFirst({
      where: {
        gapId: round.gapId,
        userId,
      },
    });

    if (!member) {
      throw new BadRequestException('User ushbu Gap aʼzosi emas');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        roundId_userId: {
          roundId,
          userId,
        },
      },
    });

    if (existingPayment) {
      throw new ConflictException(
        'Bu user uchun ushbu round paymenti allaqachon mavjud',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount 0 dan katta bo‘lishi kerak');
    }

    return this.prisma.payment.create({
      data: {
        roundId,
        userId,
        amount,
      },
    });
  }
}
