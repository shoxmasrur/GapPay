import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../config/prisma/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { Token } from '../../infrastructure/lib/Token';

@Injectable()
export class DeviceService {
  constructor(private readonly db: PrismaService) {}

  async findAll(userId: number) {
    const devices = await this.db.device.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        device: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successRes(devices);
  }

  async remove(userId: number, refreshToken: string, deviceId: number) {
    const verifiedData = await Token.verifyToken(refreshToken, 'refresh');

    if (
      !verifiedData ||
      typeof verifiedData.sub !== 'number' ||
      typeof verifiedData.deviceId !== 'number'
    ) {
      throw new BadRequestException('Refresh token yaroqsiz');
    }

    const currentDevice = await this.db.device.findFirst({
      where: {
        id: verifiedData.deviceId,
        userId,
      },
    });

    if (!currentDevice) {
      throw new BadRequestException('Joriy qurilma topilmadi');
    }

    const currentDate = new Date();

    const diffInMinutes = Math.floor(
      (currentDate.getTime() - currentDevice.createdAt.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1440) {
      throw new BadRequestException(
        "Boshqa qurilmani o'chirish uchun yangi qurilmaga 24 soat to'lishi kerak",
      );
    }

    if (verifiedData.deviceId === deviceId) {
      throw new BadRequestException("Joriy qurilmani o'chirib bo'lmaydi");
    }

    const device = await this.db.device.findFirst({
      where: {
        id: deviceId,
        userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Qurilma topilmadi');
    }

    await this.db.device.delete({
      where: {
        id: deviceId,
      },
    });

    return successRes({
      message: "Qurilma muvaffaqiyatli o'chirildi",
    });
  }
}
