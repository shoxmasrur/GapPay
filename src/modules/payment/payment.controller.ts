import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';
import { UserId } from '../../common/decorator/current-user.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @UserId() userId: number) {
    return this.paymentService.create(userId, dto);
  }
}
