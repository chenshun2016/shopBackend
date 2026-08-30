// sms.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto, SendSmsResponseDto } from './dto/send-sms.dto';

@ApiTags('短信')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: '发送短信验证码' })
  @ApiOkResponse({ description: '发送成功', type: SendSmsResponseDto })
  sendCode(@Body() dto: SendSmsDto) {
    return this.smsService.sendSmsCode(dto.phone);
  }
}
