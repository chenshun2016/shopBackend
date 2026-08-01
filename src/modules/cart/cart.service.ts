import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly repo: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async findByUserId(userId: number): Promise<CartItem[]> {
    return this.repo.find({
      where: { userId },
      relations: { product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async addItem(
    userId: number,
    productId: number,
    quantity: number = 1,
  ): Promise<CartItem> {
    const product = await this.productsService.findOne(productId);
    if (!product.isActive) throw new BadRequestException('商品已下架');
    if (product.stock < quantity) throw new BadRequestException('库存不足');

    // Check if item already exists in cart
    const existing = await this.repo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      existing.quantity += quantity;
      return this.repo.save(existing);
    }

    const item = this.repo.create({ userId, productId, quantity });
    return this.repo.save(item);
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    const item = await this.repo.findOne({
      where: { userId, productId },
    });
    if (!item) throw new NotFoundException('购物车中未找到该商品');

    const product = await this.productsService.findOne(productId);
    if (product.stock < quantity) throw new BadRequestException('库存不足');

    item.quantity = quantity;
    return this.repo.save(item);
  }

  async removeItem(userId: number, productId: number): Promise<void> {
    const item = await this.repo.findOne({
      where: { userId, productId },
    });
    if (!item) throw new NotFoundException('购物车中未找到该商品');
    await this.repo.remove(item);
  }

  async clearCart(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }
}
