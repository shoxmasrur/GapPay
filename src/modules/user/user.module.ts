import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { OtpService } from '../../infrastructure/otp/otp.service';

@Module({
  controllers: [UserController],
  providers: [UserService, OtpService],
})
export class UserModule {}
