import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;
}

export class SendSmsResponseDto {
  @ApiProperty({ description: '是否发送成功' })
  success: boolean;
}
