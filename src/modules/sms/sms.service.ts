// sms.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

interface aaa {
  data: object;
  // message: string;
}

interface bbb {
  message: string;
}

@Injectable()
export class SmsService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * 生成6位随机验证码
   */
  generateCode(): string {
    // 方式1: 纯数字
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送短信验证码
   */
  async sendSmsCode(phoneNumber: string): Promise<any> {
    // 生成随机验证码
    const code = this.generateCode();

    // 调用API发送
    const url = 'https://push.spug.cc/sms/QpGb*****Rw';
    const params = new URLSearchParams({
      to: phoneNumber,
      code: code,
    });

    try {
      const response: aaa = await lastValueFrom(
        this.httpService.get(`${url}?${params.toString()}`),
      );

      return {
        success: true,
        code: code, // 生产环境不要返回code给前端
        data: response.data,
      };
    } catch (error: bbb) {
      throw new Error(`短信发送失败: ${error.message}`);
    }
  }
}
