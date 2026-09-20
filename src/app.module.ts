import { Module } from '@nestjs/common';
import { PrismaModule } from './config/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RedisModule } from './config/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    RedisModule
  ]
})
export class AppModule {}
