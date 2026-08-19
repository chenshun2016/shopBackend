import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SellersService } from './sellers.service';
import {
  CurrentUser,
  UserPayload,
} from 'src/common/decorators/current-user.decorator';

@ApiTags('商家')
@Controller('sellers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('list')
  @ApiOperation({ summary: '获取商家信息' })
  getSellerList(@CurrentUser() user: UserPayload) {
    console.log(user, 888222);
    return this.sellersService.getSellerList(user.userId);
  }
}
