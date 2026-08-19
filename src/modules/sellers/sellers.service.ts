import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Seller } from './entities/seller.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSellerDto } from './dto/create-seller-dto';
import { UpdateSellerDto } from './dto/update-seller-dto';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellersRepository: Repository<Seller>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getSellerList(userId: number): Promise<Seller[]> {
    // 这里要改成判断用户是管理员
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    console.log(user, 'uuuu');
    if (user?.role === UserRole.ADMIN) {
      const sellers = await this.sellersRepository.find({});
      return sellers;
    } else {
      throw new ForbiddenException('无权限访问');
    }
  }

  async createSeller(data: CreateSellerDto, userId: number): Promise<Seller> {
    const existingSellerByName = await this.sellersRepository.findOne({
      where: { shopName: data.shopName },
    });
    if (existingSellerByName) {
      throw new ConflictException(`店铺名称 "${data.shopName}" 已存在，请更换`);
    }

    const existingSellerByPhone = await this.sellersRepository.findOne({
      where: { contactPhone: data.contactPhone },
    });
    if (existingSellerByPhone) {
      throw new ConflictException(`电话 "${data.contactPhone}" 已绑定其他店铺`);
    }
    console.log(data, 222555);
    const seller = this.sellersRepository.create({ ...data, userId });
    return this.sellersRepository.save(seller);
  }

  async updateSeller(
    id: number,
    data: UpdateSellerDto,
    userId: number,
  ): Promise<Seller> {
    const seller = await this.sellersRepository.findOne({
      where: { id, userId },
    });
    if (!seller) {
      throw new NotFoundException('未找到该商家的店铺信息');
    }
    if (data.shopName === seller.shopName) {
      throw new ConflictException('店名已被注册');
    }
    if (data.contactPhone === seller.contactPhone) {
      throw new ConflictException('电话已被注册');
    }
    if (!data.shopName && !data.contactPhone) {
      throw new BadRequestException('至少需要提供一个更新字段');
    }
    Object.assign(seller, data);
    return this.sellersRepository.save(seller);
  }
}
