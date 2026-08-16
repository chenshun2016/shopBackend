import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

export class UpdatePasswordDto {
  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsOptional()
  password: string;

  @ApiPropertyOptional({ description: '用户名', example: '哥哥' })
  @IsOptional()
  @IsString()
  @Matches(/^[\u4e00-\u9fa5]{2,4}$/, {
    message: '姓名必须是2-4个汉字',
  })
  username: string;
}
