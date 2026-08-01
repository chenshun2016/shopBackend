import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: '订单状态',
    enum: OrderStatus,
    example: 'confirmed',
  })
  @IsString()
  @IsIn(Object.values(OrderStatus))
  status: OrderStatus;
}
