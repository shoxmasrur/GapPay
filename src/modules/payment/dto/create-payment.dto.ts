import { IsInt, Min } from "class-validator";


export class CreatePaymentDto{

  @IsInt()
  @Min(1)
  roundId!:number;

  @IsInt()
  @Min(1)
  amount!: number;
    

}