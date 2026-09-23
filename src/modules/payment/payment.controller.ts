import { Body, Controller, Post } from "@nestjs/common";
import { PrismaService } from "../../config/prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentService } from "./payment.service";
import { UserId } from "../../common/decorator/current-user.decorator";
import { CreateManualPaymentDto } from "./dto/create-manual-payment.dto";



@Controller('payments')
export class PaymentController{

    constructor(
        private readonly paymentService:PaymentService
    ){}

    @Post()
    create(@Body() dto:CreatePaymentDto,
            @UserId()  userId:number){
        return this.paymentService.create(userId, dto)
    }


    @Post('manual')
    async processManualPayment(@UserId() userId:number,
        @Body() dto:CreateManualPaymentDto){
            return this.paymentService.createManualPayment(dto, userId)
        }
}