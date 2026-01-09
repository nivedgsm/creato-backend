import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthRequest } from '../auth/auth-request.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===============================
  // PUBLIC
  // ===============================

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(
      dto.email,
      dto.password,
      dto.role,
    );
  }

  // ===============================
  // AUTHENTICATED
  // ===============================

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers() {
    return this.usersService.getAllUsers();
  }

  // ===============================
  // ADMIN ONLY
  // ===============================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin')
  adminOnly() {
    return { message: 'Admins only' };
  }

  // ===============================
  // CREATOR STATS
  // ===============================

  @UseGuards(JwtAuthGuard, RolesGuard) // 🔴 THIS WAS THE MISSING PIECE
  @Roles('CREATOR')
  @Get('creator/stats')
  async getCreatorStats(@Req() req: AuthRequest) {
    return this.usersService.getCreatorStats(req.user.userId);
  }
}
