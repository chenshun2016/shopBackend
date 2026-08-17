// src/modules/address/dto/batch-delete-address.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchDeleteAddressDto {
  @ApiProperty({
    description: '要删除的地址ID列表',
    type: [Number],
    example: [1, 2, 3],
    minimum: 1,
    maximum: 100,
  })
  @IsArray({ message: '必须是一个数组' })
  @ArrayMinSize(1, { message: '至少需要删除一个地址' })
  @ArrayMaxSize(100, { message: '单次最多删除100个地址' })
  @IsNumber({}, { each: true, message: '每个ID必须是数字' })
  @Type(() => Number)
  ids: number[];
}
