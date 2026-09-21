import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Token } from '../../infrastructure/lib/Token';
import { Roles } from '../enum';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Tizimga kirishda nosozlik');
    }

    const data = await Token.verifyToken(accessToken, 'access');

    if (
      !data ||
      typeof data.sub !== 'number' ||
      !Object.values(Roles).includes(data.role)
    ) {
      throw new UnauthorizedException('Tizimga kirishda nosozlik');
    }

    req.user = {
      sub: data.sub,
      role: data.role,
    };

    return true;
  }
}
