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
import { Response } from 'express';
import { Token } from '../../infrastructure/lib/Token';

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) {}

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
  async login(dto: LoginDto, res: Response) {
    const { phone, password } = dto;

    const user: any = await this.db.user.findUnique({
      where: { phone },
    });

    const isMatchPassword = await Crypt.compare(
      password,
      user ? user.password : '',
    );

    if (!isMatchPassword) {
      throw new BadRequestException('Telefon raqam yoki parol xato');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    const { accessToken, refreshToken } = await Token.getToken(payload);

    Token.setCookie(res, accessToken, refreshToken);

    return successRes(
      {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      201,
    );
  }

  async logout(res: Response) {
    Token.clearCookie(res);

    return successRes({});
  }
}
