import { ForbiddenException, Injectable } from '@nestjs/common';
import { Seller } from './entities/seller.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}
