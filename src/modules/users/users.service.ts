import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async create(data: Partial<User>): Promise<User> {
    if (!data.username) {
      throw new ConflictException('用户名不能为空');
    }
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) throw new ConflictException('用户名已存在');

    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) throw new ConflictException('邮箱已被注册');
    }

    if (data.phone) {
      const existingPhone = await this.findByPhone(data.phone);
      if (existingPhone) throw new ConflictException('手机号已被注册');
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) throw new ConflictException('邮箱已被注册');
    }
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async updatePassword(data: UpdatePasswordDto): Promise<User> {
    if (!data.email) throw new ConflictException('请填写邮箱');
    const user = await this.findByEmail(data.email);
    if (!user) throw new ConflictException('该邮箱未注册');
    if (!data.username) throw new ConflictException('请填写用户名');
    if (!data.password) throw new ConflictException('请填写新密码');
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(data.password, salt);
    user.username = data.username;
    return this.usersRepository.save(user);
  }
}
