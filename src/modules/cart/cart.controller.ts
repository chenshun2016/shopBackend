import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('购物车')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '查看购物车' })
  findAll(@CurrentUser() user: UserPayload) {
    return this.cartService.findByUserId(user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: '添加商品到购物车' })
  addItem(@CurrentUser() user: UserPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.userId, dto.productId, dto.quantity);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: '修改购物车商品数量' })
  updateQuantity(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(
      user.userId,
      +productId,
      dto.quantity,
    );
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: '删除购物车中某商品' })
  removeItem(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user.userId, +productId);
  }

  @Delete()
  @ApiOperation({ summary: '清空购物车' })
  clearCart(@CurrentUser() user: UserPayload) {
    return this.cartService.clearCart(user.userId);
  }
}
