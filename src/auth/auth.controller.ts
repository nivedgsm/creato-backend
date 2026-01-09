import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../users/dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ───────── Login
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
    );
  }

  // ───────── Validate current user (NEW, REQUIRED)
 @UseGuards(JwtAuthGuard)
@Get('me')
me(@Req() req: Request) {
  const user = req.user as { userId: string };
  return this.authService.getMe(user.userId);
}

}

