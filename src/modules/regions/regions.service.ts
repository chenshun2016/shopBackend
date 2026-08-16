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

  async findByParentCode(parentCode: number): Promise<Region[]> {
    return this.repo.find({
      where: { parentCode: String(parentCode) },
      order: { parentCode: 'DESC' },
    });
  }
}
