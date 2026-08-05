import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    private readonly productsService: ProductsService,
  ) {}

  // 添加收藏（幂等：已收藏则直接返回已存在记录）
  async add(userId: number, productId: number): Promise<Favorite> {
    const product = await this.productsService.findOne(productId);
    if (!product.isActive) {
      throw new BadRequestException('商品已下架');
    }
    const existing = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });
    if (existing) {
      return existing;
    }
    const favorite = this.favoriteRepo.create({ userId, productId });
    return this.favoriteRepo.save(favorite);
  }

  // 取消收藏（幂等：未收藏也视为成功，商品不存在则抛 404）
  async remove(userId: number, productId: number): Promise<void> {
    await this.productsService.findOne(productId);
    await this.favoriteRepo.delete({ userId, productId });
  }

  // 我的收藏列表（分页，返回上架商品实体含分类，按收藏时间倒序）
  async getMyFavorites(
    userId: number,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<PaginatedResult<Product>> {
    const qb = this.favoriteRepo
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('f.userId = :userId', { userId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('f.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [favorites, total] = await qb.getManyAndCount();
    const list = favorites.map((f) => f.product);
    return { list, total, page, limit };
  }
}
