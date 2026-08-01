import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: '商品ID', example: 1 })
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ description: '数量', default: 1, example: 2 })
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
