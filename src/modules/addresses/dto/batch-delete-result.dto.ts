// src/modules/address/dto/batch-delete-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BatchDeleteResultDto {
  @ApiProperty({
    description: '成功删除的数量',
    example: 2,
  })
  successCount: number;

  @ApiProperty({
    description: '失败的数量',
    example: 1,
  })
  failCount: number;

  @ApiProperty({
    description: '失败的ID列表及原因',
    type: 'object',
    additionalProperties: {
      type: 'string',
    },
    example: { '5': '地址不存在', '8': '地址正在使用中' },
  })
  errors: Record<string, string>;

  @ApiProperty({
    description: '成功删除的ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  successIds: number[];
}
