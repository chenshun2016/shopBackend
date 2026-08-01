import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'john' })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({ description: '密码', example: 'Pass1234' })
  @IsString()
  @MinLength(6)
  password: string;
}
