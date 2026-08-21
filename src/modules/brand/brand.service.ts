import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getBrandAll(parentId: number = 0): Promise<Brand[]> {
    const brands = await this.brandsRepository.find({
      select: {
        id: true,
        name: true,
      },
      where: { parentId },
      order: { name: 'ASC' },
    });
    return brands;
  }

  async createBrand(
    createBrandDto: CreateBrandDto,
    userId: number,
  ): Promise<Brand> {
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
    });
    // 必须检查 null
    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以创建品牌');
    }
    // 1. 检查品牌名称是否已存在
    const existingBrand = await this.brandsRepository.findOne({
      where: { name: createBrandDto.name },
    });
    if (existingBrand) {
      throw new BadRequestException(`品牌名称 "${createBrandDto.name}" 已存在`);
    }

    console.log(createBrandDto, 'createBrandDto111');
    // 2. 处理父品牌逻辑
    const parentId = createBrandDto.parentId ?? 0; // 默认顶级品牌
    let level = 0;
    let parent: Brand | null = null;

    if (parentId !== 0) {
      // 2.1 检查父品牌是否存在
      parent = await this.brandsRepository.findOne({
        where: { id: parentId },
        select: {
          id: true,
          level: true,
          path: true,
        },
      });

      if (!parent) {
        throw new NotFoundException(`父品牌 ID ${parentId} 不存在`);
      }

      // 2.2 计算层级
      level = parent.level + 1;
    }

    // 3. 创建品牌实体
    const brand = this.brandsRepository.create({
      ...createBrandDto,
      parentId: parentId,
      level: level,
    });

    // 4. 保存品牌（先保存获取 id）
    const savedBrand = await this.brandsRepository.save(brand);

    // 5. 更新 path 字段
    if (parentId === 0) {
      // 顶级品牌
      savedBrand.path = `/${savedBrand.id}/`;
    } else if (parent) {
      // 子品牌
      savedBrand.path = `${parent.path}${savedBrand.id}/`;
    }

    // 6. 最终保存
    return this.brandsRepository.save(savedBrand);
  }
}
