import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Address } from './entities/address.entities';
import { BatchDeleteAddressDto } from './batch-delete-address.dto';
import { BatchDeleteResultDto } from './batch-delete-result.dto';
import { CreateAddressDto } from './create-address.dto';
import { UpdateAddressDto } from './update-address.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
    private dataSource: DataSource,
  ) {}

  async createAddress(id: number, dto: CreateAddressDto): Promise<Address> {
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
      const address = this.addressRepository.create({
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
}
