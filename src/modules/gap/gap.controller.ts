import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { GapService } from './gap.service';
import { AuthGuard } from '../../common/guard/jwt-auth.guard';
import { UserId, UserRole } from '../../common/decorator/current-user.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGapDto } from './dto/create-gap.dto';
import { Roles } from '../../common/enum';

@UseGuards(AuthGuard)
@Controller('gap')
export class GapController {
    constructor(private readonly gapService: GapService) { }

    @Post()
    create(@UserId() userId: number, @Body() dto: CreateGapDto) {
        return this.gapService.create(userId, dto);
    }

    @Post(':id/member')
    addMember(
        @UserId() organizerId: number,
        @Param('id', ParseIntPipe) gapId: number,
        @Body() dto: AddMemberDto,
    ) {
        return this.gapService.addMember(organizerId, gapId, dto.userId);
    }

    @Post(':id/start')
    startGap(@UserId() userId: number, @Param('id', ParseIntPipe) gapId: number) {
        return this.gapService.startGap(userId, gapId);
    }

    @Get()
    findAll(
        @UserId() userId: number,
        @UserRole() role: Roles
    ) {
        return this.gapService.findAll(userId, role);
    }

    @Get(':id')
    findOne(
        @UserId() userId: number,
        @UserRole() role: Roles,
        @Param('id', ParseIntPipe) gapId: number,
    ) {
        return this.gapService.findOne(userId, role, gapId);
    }
}
