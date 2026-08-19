import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Seller } from './entities/seller.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSellerDto } from './dto/create-seller-dto';

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

  async createSeller(data: CreateSellerDto, userId: number): Promise<Seller>{
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
}
