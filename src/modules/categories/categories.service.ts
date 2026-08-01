import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.repo.find({ relations: { children: true } });
    // Return only root categories with children nested
    return categories.filter((c) => !c.parentId);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.repo.findOne({
      where: { id },
      relations: { children: true },
    });
    if (!category) throw new NotFoundException('分类不存在');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('分类名称已存在');

    const category = this.repo.create(dto);
    return this.repo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException('分类名称已存在');
    }

    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.repo.remove(category);
  }
}
