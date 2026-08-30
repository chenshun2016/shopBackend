// sms.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendCode(@Body('phone') phone: string) {
    // 验证手机号格式
    if (!this.isValidPhone(phone)) {
      throw new Error('手机号格式不正确');
    }

    return this.smsService.sendSmsCode(phone);
  }

  private isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }
}
