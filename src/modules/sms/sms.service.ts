// sms.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

/** spug 推送助手短信接口的响应格式：code=200 仅表示请求已受理，短信为异步发送 */
interface SmsApiResponse {
  code: number;
  msg: string;
  request_id?: string;
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
      const response = await lastValueFrom(
        this.httpService.get<SmsApiResponse>(`${url}?${params.toString()}`),
      );

      return {
        success: true,
        code: code, // 生产环境不要返回code给前端
        data: response.data,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`短信发送失败: ${message}`);
    }
  }
}
