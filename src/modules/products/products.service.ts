import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  private buildQuery(query: QueryProductDto, includeInactive = false) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category');

    if (!includeInactive) {
      qb.where('p.isActive = :isActive', { isActive: true });
    }

    if (search) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where(
            'MATCH(p.name, p.description) AGAINST (:search IN BOOLEAN MODE)',
            {
              search,
            },
          ).orWhere('p.name LIKE :like', { like: `%${search}%` });
        }),
      );
    }

    if (categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined && minPrice !== null) {
      qb.andWhere('p.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice });
    }

    const allowedSortFields = ['price', 'createdAt', 'name'];
    const sortField = allowedSortFields.includes(sortBy)
      ? `p.${sortBy}`
      : 'p.createdAt';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    return qb;
  }

  async findAll(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    const qb = this.buildQuery(query, false);
    const { page = 1, limit = 10 } = query;
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, limit };
  }

  async findAllAdmin(
    query: QueryProductDto,
  ): Promise<PaginatedResult<Product>> {
    const qb = this.buildQuery(query, true);
    const { page = 1, limit = 10 } = query;
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, limit };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.repo.findOne({
      where: { id },
      relations: { category: true, comments: true },
    });
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.repo.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.repo.save(product);
  }
}
