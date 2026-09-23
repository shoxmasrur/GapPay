import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateManualPaymentDto } from './dto/create-manual-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma:PrismaService) {}

  async create(userId:number, dto: CreatePaymentDto) {
    const { roundId,  amount } = dto;

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
      throw new BadRequestException(
        'User ushbu Gap aʼzosi emas',
      );
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
      throw new BadRequestException(
        'Amount 0 dan katta bo‘lishi kerak',
      );
    }

    return this.prisma.payment.create({
      data: {
        roundId,
        userId,
        amount,
      },
    });
  }

  async createManualPayment(dto: CreateManualPaymentDto, userId: number) {
    const { obligationId, amount, notes } = dto;

    const obligation = await this.prisma.paymentObligation.findUnique({
      where: { id: obligationId },
      include: { payments: true },
    });

    if (!obligation) {
      throw new NotFoundException('To\'lov majburiyati (Obligation) topilmadi');
    }

    if (obligation.status === 'PAID') {
      throw new BadRequestException('Ushbu majburiyat bo\'yicha to\'liq to\'lov allaqachon amalga oshirilgan');
    }

    const totalPaidSoFar = obligation.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const requiredAmount = Number(obligation.amount);
    const newTotalPaid = totalPaidSoFar + amount;

    let newStatus: 'PAID' | 'PARTIAL' = 'PARTIAL';
    if (newTotalPaid >= requiredAmount) {
      newStatus = 'PAID';
    }

    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: amount,
          roundId: obligation.roundId,
          userId
        },
      });

      const updatedObligation = await tx.paymentObligation.update({
        where: { id: obligationId },
        data: {
          status: newStatus,
        },
      });

      return {
        payment,
        obligation: updatedObligation,
        remainingAmount: Math.max(0, requiredAmount - newTotalPaid),
      };
    });
  }


}