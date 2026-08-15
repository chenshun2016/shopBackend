import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容', example: '商品质量很好，物流快！' })
  @IsString()
  @MaxLength(255)
  remarks: string;
}
