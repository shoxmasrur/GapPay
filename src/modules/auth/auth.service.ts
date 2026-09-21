import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { Roles } from '../../common/enum';
import { successRes } from '../../common/helper/success-response';
import type { Response, Request } from 'express';
import { Token } from '../../infrastructure/lib/Token';
import { getDeviceInfo } from '../../common/helper/device-info';

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) { }

  async register(dto: RegisterDto) {
    const { fullName, phone, password } = dto;

    const existsPhone = await this.db.user.findUnique({
      where: { phone },
    });

    if (existsPhone) {
      throw new ConflictException('Bunday telefon raqam allaqachon mavjud');
    }

    const hashedPassword = await Crypt.hash(password);

    const user = await this.db.user.create({
      data: {
        fullName,
        phone,
        password: hashedPassword,
        role: Roles.USER,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return successRes(user, 201);
  }
  async login(
    dto: LoginDto,
    req: Request,
    res: Response,
  ) {
    const { phone, password } = dto;

    const user: any = await this.db.user.findUnique({
      where: { phone },
    });

    const isMatchPassword = await Crypt.compare(
      password,
      user?.password ?? '',
    );

    if (!isMatchPassword) {
      throw new BadRequestException(
        'Telefon raqam yoki parol xato',
      );
    }

    const { client, os } = getDeviceInfo(req);

    const device = await this.db.device.create({
      data: {
        userId: user.id,
        device: `${client?.name ?? 'Unknown'} ${os?.name ?? 'Unknown'}`,
        hashedRefreshToken: '',
      },
    });

    const payload = {
      sub: user.id,
      role: user.role,
      deviceId: device.id,
    };

    const { accessToken, refreshToken } =
      await Token.getToken(payload);

    const hashedRefreshToken =
      await Crypt.hash(refreshToken);

    await this.db.device.update({
      where: {
        id: device.id,
      },
      data: {
        hashedRefreshToken,
      },
    });

    Token.setCookie(
      res,
      accessToken,
      refreshToken,
    );

    return successRes(
      {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        deviceId: device.id,
      },
      201,
    );
  }

  async refreshToken(
    refreshToken: string,
    res: Response,
  ) {
    const verifiedData = await Token.verifyToken(
      refreshToken,
      'refresh',
    );

    const device = await this.db.device.findFirst({
      where: {
        id: verifiedData.deviceId,
        userId: verifiedData.sub,
      },
    });

    if (!device) {
      throw new BadRequestException(
        'Foydalanuvchi yoki qurilma topilmadi',
      );
    }

    const isMatchToken = await Crypt.compare(
      refreshToken,
      device.hashedRefreshToken,
    );

    if (!isMatchToken) {
      throw new BadRequestException(
        "Qurilma tizimda ro'yxatdan o'tmagan",
      );
    }

    delete verifiedData.iat;
    delete verifiedData.exp;

    const { accessToken } = await Token.getToken(
      verifiedData,
    );

    Token.setCookie(res, accessToken);

    return successRes({
      userId: device.userId,
      deviceId: device.id,
      device: device.device,
      createdAt: device.createdAt,
    });
  }

  async logout(
    refreshToken: string,
    res: Response,
  ) {
    const verifiedData = await Token.verifyToken(
      refreshToken,
      'refresh',
    );

    await this.db.device.deleteMany({
      where: {
        id: verifiedData.deviceId,
        userId: verifiedData.sub,
      },
    });

    Token.clearCookie(res);

    return successRes({});
  }
}
