import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import type { Request } from 'express';
import type { AuthRequest } from '../auth/auth-request.interface';


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ───────── Dashboard stats
  @Get('stats')
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  // ───────── Audit logs
  @Get('audit-logs')
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  // ───────── Users list
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // ───────── User detail
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  // ───────── Disable user (NEW, SAFE)
@Post('users/:id/disable')
async disableUser(
  @Param('id') id: string,
  @Req() req: AuthRequest,
) {
  return this.adminService.disableUser(
    req.user.userId,
    id,
  );
}


  // ───────── Enable user (NEW, SAFE)
  @Post('users/:id/enable')
async enableUser(
  @Param('id') id: string,
  @Req() req: AuthRequest,
) {
  return this.adminService.enableUser(
    req.user.userId,
    id,
  );
}



}
