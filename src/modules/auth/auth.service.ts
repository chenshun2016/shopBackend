import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SmsService, SMS_CODE_PREFIX } from '../sms/sms.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SmsLoginDto } from './dto/sms-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async register(dto: RegisterDto) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: UserRole.CUSTOMER,
    });

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsernameWithPassword(
      dto.username,
    );
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 手机号验证码登录：验证码通过后自动注册/登录
   */
  async smsLogin(dto: SmsLoginDto) {
    const codeKey = SMS_CODE_PREFIX + dto.phone;
    const cachedCode = await this.cacheManager.get<string>(codeKey);

    if (!cachedCode || cachedCode !== dto.code) {
      throw new UnauthorizedException('验证码错误或已过期');
    }
    // 验证码一次性：验证通过立即作废
    await this.cacheManager.del(codeKey);

    let user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      // 自动注册：用户名 user_{手机号}，无邮箱，角色 customer
      try {
        user = await this.usersService.create({
          username: 'user_' + dto.phone,
          phone: dto.phone,
          role: UserRole.CUSTOMER,
        });
      } catch (error) {
        // 并发登录竞态：两人同时通过 findByPhone 后，后者会撞唯一索引，重读一次
        if (error instanceof ConflictException) {
          user = await this.usersService.findByPhone(dto.phone);
          if (!user) throw error;
        } else {
          throw error;
        }
      }
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return this.jwtService.sign(payload);
  }
}
