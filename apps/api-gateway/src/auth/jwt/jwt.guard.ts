import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from '../jwt.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if(!authHeader){
      throw new UnauthorizedException('Authorization header missing');
    }

    const [bearer, token] = authHeader.split(' ');  // Expecting "Bearer <token>"

    if(bearer !== 'Bearer' || !token){
      throw new UnauthorizedException('Invalid token format');

    }

    const payload = this.tokenService.verifyToken(token);

    if(!payload){
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach paylaod to rquest for use in controllers

    request.user = payload;

    return true;


  }
}
