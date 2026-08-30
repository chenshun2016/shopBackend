// sms.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { lastValueFrom } from 'rxjs';

/** spug 推送助手短信接口的响应格式：code=200 仅表示请求已受理，短信为异步发送 */
interface SmsApiResponse {
  code: number;
  msg: string;
  request_id?: string;
}

export const SMS_CODE_PREFIX = 'sms:code:';
export const SMS_COOLDOWN_PREFIX = 'sms:cooldown:';
const CODE_TTL_MS = 5 * 60 * 1000; // 验证码 5 分钟有效（cache-manager v7 单位是毫秒）
const COOLDOWN_TTL_MS = 60 * 1000; // 发送冷却 60 秒

export interface SendSmsResult {
  success: boolean;
}

@Injectable()
export class SmsService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 生成6位随机验证码
   */
  generateCode(): string {
    // 方式1: 纯数字
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送短信验证码：存入 Redis（5分钟过期），不返回给调用方
   */
  async sendSmsCode(phoneNumber: string): Promise<SendSmsResult> {
    const cooldownKey = SMS_COOLDOWN_PREFIX + phoneNumber;
    if (await this.cacheManager.get(cooldownKey)) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    // 生成随机验证码
    const code = this.generateCode();

    // 调用API发送
    const url = 'https://push.spug.cc/sms/QpGb*****Rw';
    const params = new URLSearchParams({
      to: phoneNumber,
      code: code,
    });

    try {
      const response = await lastValueFrom(
        this.httpService.get<SmsApiResponse>(`${url}?${params.toString()}`),
      );

      if (response.data.code !== 200) {
        throw new BadRequestException(`短信发送失败: ${response.data.msg}`);
      }

      // spug 受理成功后才写入 Redis：发送失败不占用冷却期、不留死验证码
      await this.cacheManager.set(
        SMS_CODE_PREFIX + phoneNumber,
        code,
        CODE_TTL_MS,
      );
      await this.cacheManager.set(cooldownKey, '1', COOLDOWN_TTL_MS);

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : '未知错误';
      throw new BadRequestException(`短信发送失败: ${message}`);
    }
  }
}
