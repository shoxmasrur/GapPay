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
import { AuthGuard } from '../../config/guard/jwt-auth.guard';
import { UserUpdateDto } from './dto/user-update.dto';
import { RolesGuard } from '../../config/guard/roles.guard';
import { AccessRoles } from '../../common/decorator/roles.decorator';
import { Roles } from '../../common/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { UserId } from '../../common/decorator/current-user.decorator';
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

}
