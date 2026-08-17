import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Address } from './entities/address.entity';
import { BatchDeleteAddressDto } from './dto/batch-delete-address.dto';
import { BatchDeleteResultDto } from './dto/batch-delete-result.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
    private dataSource: DataSource,
  ) {}

  async createAddress(userId: number, dto: CreateAddressDto): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 如果设置为默认地址，清除其他默认地址
      if (dto.isDefault === 1) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Address)
          .set({ isDefault: 0 })
          .where('userId = :userId', { userId })
          .execute();
      }

      // 创建地址
      const address = this.repo.create({
        ...dto,
        userId,
      });

      const savedAddress = await queryRunner.manager.save(address);
      await queryRunner.commitTransaction();

      return savedAddress; // ✅ 返回完整的地址对象
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 获取用户地址列表（排除软删除，默认地址排前）
  async findById(userId: number): Promise<Address[]> {
    return this.repo.find({
      where: { userId, deletedAt: IsNull() },
      order: { isDefault: 'DESC', createTime: 'DESC' },
    });
  }

  // 获取地址详情（校验归属与未删除）
  async getAddressDetail(userId: number, id: number): Promise<Address> {
    const address = await this.repo.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });
    if (!address) throw new NotFoundException('地址不存在');
    return address;
  }

  // 更新地址（设默认时先清掉其他默认）
  async update(userId: number, dto: UpdateAddressDto): Promise<Address> {
    const address = await this.getAddressDetail(userId, dto.id);
    if (dto.isDefault === 1) {
      await this.repo.update({ userId }, { isDefault: 0 });
    }
    // PartialType 继承的字段全是可选的，过滤掉 undefined 再赋值，避免覆盖已有值
    const changed = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    Object.assign(address, changed);
    return this.repo.save(address);
  }

  // 删除地址（软删除：写入 deletedAt，不物理删除）
  async delete(userId: number, id: number): Promise<void> {
    const address = await this.getAddressDetail(userId, id);
    address.deletedAt = new Date();
    await this.repo.save(address);
  }

  // 批量删除：逐个尝试，返回成功/失败明细
  async batchDelete(
    userId: number,
    dto: BatchDeleteAddressDto,
  ): Promise<BatchDeleteResultDto> {
    const result: BatchDeleteResultDto = {
      successCount: 0,
      failCount: 0,
      errors: {},
      successIds: [],
    };
    for (const id of dto.ids) {
      try {
        await this.delete(userId, id);
        result.successCount++;
        result.successIds.push(id);
      } catch {
        result.failCount++;
        result.errors[String(id)] = '地址不存在或无权操作';
      }
    }
    return result;
  }
}
