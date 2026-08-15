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
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

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
  @ApiOperation({
    summary: '模拟支付',
    description:
      '对指定订单执行模拟支付，无需真实支付参数。\n\n' +
      '请求头：Authorization: Bearer <token>（必须，需为订单所属用户）\n' +
      '路径参数：id — 订单ID（从订单列表接口获取）\n' +
      '请求体：无，不需要传任何 body\n\n' +
      '支付成功后：paymentStatus → paid，status → confirmed，paidAt 记录支付时间。',
  })
  @ApiParam({
    name: 'id',
    description: '订单ID（路径参数，从订单列表接口获取）',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: '支付成功，返回更新后的订单（含订单明细 items）',
    type: Order,
  })
  @ApiNotFoundResponse({ description: '订单不存在' })
  @ApiForbiddenResponse({ description: '无权操作此订单（不是自己的订单）' })
  @ApiBadRequestResponse({
    description: '订单已支付（请勿重复操作）或订单已取消（无法支付）',
  })
  pay(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.ordersService.pay(user.userId, +id);
  }
}
