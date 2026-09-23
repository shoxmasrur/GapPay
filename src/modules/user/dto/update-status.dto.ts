import { IsEnum } from 'class-validator';
import { Status } from '../../../common/enum';

export class UpdateStatusDto {
  @IsEnum(Status)
  status!: Status;
}
