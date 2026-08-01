import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    const cartItems = await this.cartService.findByUserId(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('购物车为空，请先添加商品');
    }

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: Partial<OrderItem>[] = [];

      for (const cartItem of cartItems) {
        const product = cartItem.product;
        if (!product || !product.isActive) {
          throw new BadRequestException(
            `商品"${product?.name || '未知'}"已下架`,
          );
        }

        // Lock the product row to prevent overselling
        const lockedProduct = await queryRunner.manager
          .createQueryBuilder()
          .select('p')
          .from('products', 'p')
          .where('p.id = :id', { id: product.id })
          .setLock('pessimistic_write')
          .getOne();

        if (!lockedProduct || lockedProduct.stock < cartItem.quantity) {
          throw new BadRequestException(`商品"${product.name}"库存不足`);
        }

        // Deduct stock
        await queryRunner.manager.update(
          'products',
          { id: product.id },
          { stock: lockedProduct.stock - cartItem.quantity },
        );

        const subtotal = Number(product.price) * cartItem.quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          unitPrice: Number(product.price),
          quantity: cartItem.quantity,
        });
      }

      // Create order
      const order = queryRunner.manager.create(Order, {
        orderNo: this.generateOrderNo(),
        userId,
        totalAmount,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        shippingAddress: dto.shippingAddress,
        remark: dto.remark || undefined,
      } as any);
      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      for (const item of orderItems) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          ...item,
          orderId: savedOrder.id,
        });
        await queryRunner.manager.save(orderItem);
      }

      // Clear cart
      await queryRunner.manager.delete('cart_items', { userId });

      await queryRunner.commitTransaction();

      // Return full order with items
      return this.findOne(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByUser(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Order>> {
    const [list, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { list, total, page, limit };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  async findAllAdmin(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<PaginatedResult<Order>> {
    const where: Record<string, unknown> = {};
    if (status && (Object.values(OrderStatus) as string[]).includes(status)) {
      where.status = status;
    }
    const [list, total] = await this.orderRepo.findAndCount({
      where,
      relations: { items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { list, total, page, limit };
  }

  async pay(
    userId: number,
    orderId: number,
    skipOwnershipCheck = false,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    if (!skipOwnershipCheck && order.userId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('订单已支付，请勿重复操作');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('订单已取消，无法支付');
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.CONFIRMED;
    order.paidAt = new Date();
    return this.orderRepo.save(order);
  }

  async updateStatus(orderId: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);
    order.status = status;
    return this.orderRepo.save(order);
  }
}
