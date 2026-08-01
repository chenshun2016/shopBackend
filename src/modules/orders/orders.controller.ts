import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('订单')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '创建订单（从购物车结算）' })
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '我的订单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.ordersService.findByUser(user.userId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情' })
  findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: '模拟支付' })
  pay(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.ordersService.pay(user.userId, +id);
  }
}
