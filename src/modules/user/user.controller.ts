import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { UserUpdateDto } from './dto/user-update.dto';
import { RolesGuard } from '../../common/guard/roles.guard';
import { AccessRoles } from '../../common/decorator/roles.decorator';
import { Roles } from '../../common/enum';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UserId } from '../../common/decorator/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { FILE_OPTIONS } from '../../infrastructure/lib/File';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles('ID')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPER_ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles('ID')
  @UseInterceptors(FileInterceptor('file', FILE_OPTIONS))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserUpdateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userService.update(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles('ID')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @UserId() currentUserId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.remove(id, currentUserId, res);
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userService.forgotPassword(dto.phone);
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.userService.verifyOtp(dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(dto);
  }
}
