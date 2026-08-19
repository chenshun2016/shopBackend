import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller-dto';
import { UpdateSellerDto } from './dto/update-seller-dto';
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
    return this.sellersService.getSellerList(user.userId);
  }

  @Post('create')
  @ApiOperation({ summary: '创建商家' })
  createSeller(
    @CurrentUser() user: UserPayload,
    @Body() data: CreateSellerDto,
  ) {
    return this.sellersService.createSeller(data, user.userId);
  }

  @Post('update/:id')
  @ApiOperation({ summary: '更新商家' })
  updateSeller(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserPayload,
    @Body() data: UpdateSellerDto,
  ) {
    return this.sellersService.updateSeller(id, data, user.userId);
  }
}
