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
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return successRes(user);
  }

  async update(userId: number, dto: UserUpdateDto) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
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

    const updatedUser = await this.db.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successRes(updatedUser);
  }

  async remove(id: number) {
    const user = await this.db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    await this.db.user.delete({
      where: { id },
    });

    return successRes({
      message: 'Foydalanuvchi muvaffaqiyatli ochirildi',
    });
  }

  async forgotPassword(phone: string) {
    const user = await this.db.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new NotFoundException(
        'Bunday telefon raqamli foydalanuvchi topilmadi',
      );
    }

    return this.otp.sendOtp(phone);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otp.verifyOtp(dto.phone, dto.code);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const phone = await this.otp.getResetPhone(dto.resetToken);

    if (phone !== dto.phone.replace(/\D/g, '')) {
      throw new BadRequestException('Reset token noto‘g‘ri');
    }

    const hashedPassword = await Crypt.hash(dto.newPassword);

    await this.db.user.update({
      where: { phone: dto.phone },
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
