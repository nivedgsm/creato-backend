import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: { sub: string; role: string }) {
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      role: true,
      isActive: true, // we still FETCH it (important)
    },
  });

  if (!user) {
    throw new UnauthorizedException();
  }

  // ❗ DO NOT block disabled users here
  return {
    id: user.id,
    role: user.role,
    isActive: user.isActive, // pass it forward
  };
}



}
