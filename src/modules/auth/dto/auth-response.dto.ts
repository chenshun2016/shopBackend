import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'john' })
  username: string;

  @ApiProperty({
    description: '邮箱',
    example: 'john@example.com',
    nullable: true,
  })
  email: string | null;

  @ApiProperty({ description: '角色', example: 'customer' })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT Token', example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken: string;

  @ApiProperty({ description: '用户信息' })
  user: UserInfo;
}

export class RegisterResponseDto extends LoginResponseDto {}
