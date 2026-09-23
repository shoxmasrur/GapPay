
import { IsNotEmpty, IsNumber, IsString, IsPositive, IsOptional } from 'class-validator';

export class CreateManualPaymentDto {
  @IsString()
  @IsNotEmpty()
  obligationId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number; 

  @IsString()
  @IsOptional()
  notes?:string;
}