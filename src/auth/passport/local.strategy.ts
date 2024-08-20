
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {

    constructor(private authService: AuthService) {
        super();
    }

    async validate(username: string, password: string): Promise<any> {

        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException("Email hoặc mật khẩu không hợp lệ");
        }
        if (user.isActive === false) {
            throw new BadRequestException("Tài khoản chưa được kích hoạt");
        }
        return user;
    }
}