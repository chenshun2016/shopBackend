import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SellersService } from './sellers.service';

@ApiTags('商家')
@Controller('sellers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}
}
