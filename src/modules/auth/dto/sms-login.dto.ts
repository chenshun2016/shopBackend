import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class SmsLoginDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @Matches(/^\d{6}$/, { message: '验证码格式不正确' })
  code: string;
}
