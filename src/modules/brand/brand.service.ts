import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
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
      createdBy: userId,
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

    // 5.5 关联分类（可选）：写入 brand_category_relation 关联表
    if (createBrandDto.categoryIds?.length) {
      const ids = [...new Set(createBrandDto.categoryIds)];
      const categories = await this.categoriesRepository.findBy({
        id: In(ids),
      });
      if (categories.length !== ids.length) {
        throw new BadRequestException('部分分类不存在，请检查 categoryIds');
      }
      console.log(categories, 'categories123');
      savedBrand.categories = categories;
    }

    // 6. 最终保存（同时写入品牌-分类关联）
    return this.brandsRepository.save(savedBrand);
  }

  async updateBrand(
    updateBrandDto: UpdateBrandDto,
    userId: number,
  ): Promise<Brand | null> {
    // 1. 验证用户权限
    const currentUser = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!currentUser) {
      throw new NotFoundException('用户不存在');
    }
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以更新品牌');
    }
    // 2. 查询要更新的品牌
    const curBrand = await this.brandsRepository.findOne({
      where: { id: updateBrandDto.id },
      relations: {
        categories: true, // 加载分类关联
      }, // 加载关联的分类
    });
    if (!curBrand) {
      throw new NotFoundException('没有找到该品牌');
    }
    // 3. 检查品牌名称是否冲突（如果要更新名称）
    if (updateBrandDto.name && updateBrandDto.name !== curBrand.name) {
      const existingBrand = await this.brandsRepository.findOne({
        where: { name: updateBrandDto.name },
      });
      if (existingBrand && existingBrand.id !== curBrand.id) {
        throw new BadRequestException(
          `品牌名称 "${updateBrandDto.name}" 已存在`,
        );
      }
    }
    // 4. 处理父品牌变更
    let level = curBrand.level;
    let path = curBrand.path;
    if (
      updateBrandDto.parentId !== undefined &&
      updateBrandDto.parentId !== curBrand.parentId
    ) {
      const parentId = updateBrandDto.parentId ?? 0;

      if (parentId === 0) {
        // 变更为顶级品牌
        level = 0;
        path = `/${curBrand.id}/`;
      } else {
        // 检查新父品牌是否存在
        const parent = await this.brandsRepository.findOne({
          where: { id: parentId },
          select: { id: true, level: true, path: true },
        });
        if (!parent) {
          throw new NotFoundException(`父品牌 ID ${parentId} 不存在`);
        }
        // 防止将品牌设置为自己或自己的子品牌作为父品牌
        if (parentId === curBrand.id) {
          throw new BadRequestException('不能将品牌自身设为父品牌');
        }
        // 检查是否循环引用（父品牌的 path 中是否包含当前品牌的 id）
        if (parent.path && parent.path.includes(`/${curBrand.id}/`)) {
          throw new BadRequestException(
            '不能将子品牌设为父品牌，会造成循环引用',
          );
        }

        level = parent.level + 1;
        path = `${parent.path}${curBrand.id}/`;
      }
    }

    // 5. 更新品牌基本信息
    Object.assign(curBrand, {
      ...updateBrandDto,
      level: level,
      path: path,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    // 6. 处理分类关联更新
    if (updateBrandDto.categoryIds !== undefined) {
      const categoryIds = updateBrandDto.categoryIds;

      if (!categoryIds || categoryIds.length === 0) {
        // 清空所有分类关联
        curBrand.categories = [];
      } else {
        // 去重并查询分类
        const ids = [...new Set(categoryIds)];
        const categories = await this.categoriesRepository.findBy({
          id: In(ids),
        });
        if (categories.length !== ids.length) {
          throw new BadRequestException('部分分类不存在，请检查 categoryIds');
        }
        // 更新分类关联（直接赋值，TypeORM 会自动处理中间表）
        curBrand.categories = categories;
      }
    }

    // 7. 保存更新（TypeORM 会同时更新品牌信息和中间表）
    await this.brandsRepository.save(curBrand);

    // 8. 如果父品牌变更，需要递归更新所有子品牌的 path 和 level
    if (
      updateBrandDto.parentId !== undefined &&
      updateBrandDto.parentId !== curBrand.parentId
    ) {
      await this.updateChildrenPaths(curBrand.id, path, level + 1);
    }

    // 9. 返回更新后的完整数据
    return this.brandsRepository.findOne({
      where: { id: curBrand.id },
      relations: {
        categories: true, // 加载分类关联
      },
    });
  }

  // 辅助方法：递归更新子品牌的 path 和 level
  private async updateChildrenPaths(
    parentId: number,
    parentPath: string,
    nextLevel: number,
  ): Promise<void> {
    const children = await this.brandsRepository.find({
      where: { parentId: parentId },
    });

    for (const child of children) {
      const newPath = `${parentPath}${child.id}/`;
      const newLevel = nextLevel;

      await this.brandsRepository.update(child.id, {
        path: newPath,
        level: newLevel,
      });

      // 递归更新孙品牌
      await this.updateChildrenPaths(child.id, newPath, newLevel + 1);
    }
  }

  // 查品牌树形结构
  async getBrandsTree(): Promise<any> => {
    try {
      // 1. 先从数据库获取所有品牌数据（假设品牌有父子关系）
      const brands = await this.brandsRepository.find({
        where: { isDeleted: false },
        order: { sortOrder: 'ASC', createTime: 'ASC' }
      });

      // 2. 构建树形结构
      const tree = this.buildTree(brands);
      
      return {
        code: 200,
        data: tree,
        message: '获取品牌树成功'
      };
    } catch (error) {
      console.error('获取品牌树失败:', error);
      throw new Error('获取品牌树失败');
    }
  }

  /**
   * 构建树形结构（递归）
   */
  private buildTree(items: any[], parentId: string | null = null): any[] {
    const result: any[] = [];
    
    for (const item of items) {
      // 找到当前节点的子节点
      if (item.parentId === parentId) {
        const children = this.buildTree(items, item.id);
        
        // 构建节点对象
        const node = {
          id: item.id,
          name: item.name,
          code: item.code,
          level: item.level,
          sortOrder: item.sortOrder,
          icon: item.icon,
          status: item.status,
          // 如果有子节点才添加children字段
          ...(children.length > 0 && { children })
        };
        
        result.push(node);
      }
    }
    
    return result;
  }
}

