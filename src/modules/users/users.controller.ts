import { Controller, Get, Put, Body, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: '获取个人信息' })
  getProfile(@CurrentUser() user: UserPayload) {
    return this.usersService.findById(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: '修改个人信息' })
  updateProfile(@CurrentUser() user: UserPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.userId, dto);
  }

  @Public() // 不交验token
  @Post('updatePassword')
  @ApiOperation({ summary: '修改密码' })
  updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(dto);
  }
}
