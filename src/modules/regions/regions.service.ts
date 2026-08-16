import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly repo: Repository<Region>,
  ) {}

  async findByParentCode(parentCode?: string): Promise<Region[]> {
    // 不带 parentCode 返回省级，带则返回其下级
    const where = parentCode ? { parentCode } : { level: 1 };
    return this.repo.find({
      where,
      order: { code: 'ASC' },
    });
  }
}
