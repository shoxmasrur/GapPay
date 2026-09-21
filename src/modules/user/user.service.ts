import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { UserUpdateDto } from './dto/user-update.dto';
import { OtpService } from '../../infrastructure/otp/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { File } from '../../infrastructure/lib/File';
import type { Response } from 'express';
import { Token } from '../../infrastructure/lib/Token';

@Injectable()
export class UserService {
  constructor(
    private readonly db: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async findAll() {
    const users = await this.db.user.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return successRes(users);
  }

  async findOne(id: number) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return successRes(user);
  }

  async update(id: number, dto: UserUpdateDto, avatar?: Express.Multer.File) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existsPhone = await this.db.user.findUnique({
        where: { phone: dto.phone },
      });

      if (existsPhone) {
        throw new ConflictException('Bunday telefon raqam allaqachon mavjud');
      }
    }

    let avatarUrl = user.avatar;

    if (avatar) {
      if (avatarUrl && (await File.exist(avatarUrl))) {
        await File.delete(avatarUrl);
      }

      avatarUrl = await File.create(avatar);
    }

    const update = await this.db.user.update({
      where: { id },
      data: {
        ...dto,
        avatar: avatarUrl,
      },
      omit: { password: true },
    });

    return successRes({
      data: update,
    });
  }

  async remove(id: number, currentUserId: number, res: Response) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    if (user.avatar && (await File.exist(user.avatar))) {
      await File.delete(user.avatar);
    }

    await this.db.user.delete({
      where: { id },
    });

    if (currentUserId === id) {
      Token.clearCookie(res);
    }

    return successRes({
      message: 'Foydalanuvchi muvaffaqiyatli ochirildi',
    });
  }

  async forgotPassword(phone: string) {
    const user = await this.db.user.findUnique({
      where: { phone },
    });

    if (user) {
      await this.otp.sendOtp(phone);
    }

    return successRes({
      message:
        'Agar bu telefon raqam tizimda mavjud bo‘lsa, OTP kodi yuborildi',
    });
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otp.verifyOtp(dto.phone, dto.code);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const phone = await this.otp.getResetPhone(dto.resetToken);

    const normalizedPhone = dto.phone.replace(/\D/g, '');

    if (phone !== normalizedPhone) {
      throw new BadRequestException('Reset token notogri');
    }

    const hashedPassword = await Crypt.hash(dto.newPassword);

    await this.db.user.update({
      where: {
        phone: normalizedPhone,
      },
      data: {
        password: hashedPassword,
      },
    });

    await this.otp.deleteResetToken(dto.resetToken);

    return successRes({
      message: 'Parol muvaffaqiyatli yangilandi',
    });
  }
}
