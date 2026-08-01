import {
  Controller,
  Get,
  Put,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from '../orders/orders.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { OrderStatus } from '../orders/entities/order.entity';
import { BadRequestException } from '@nestjs/common';

@ApiTags('后台管理 - 订单')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '所有订单列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAllAdmin(+page, +limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '修改订单状态' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    if (!Object.values(OrderStatus).includes(dto.status)) {
      throw new BadRequestException('无效的订单状态');
    }
    return this.ordersService.updateStatus(+id, dto.status);
  }

  @Put(':id/pay')
  @ApiOperation({ summary: '模拟支付（管理员）' })
  adminPay(@Param('id') id: string) {
    return this.ordersService.pay(0, +id, true);
  }
}
