import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from '@/helpers/util';
import { ChangePasswordDto, CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) return null;

    const isValidPassword = await comparePassword(pass, user.password);
    if (!isValidPassword) return null;
    return user;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      user: {
        email: user.email,
        _id: user._id,
        name: user.name
      },
      access_token: this.jwtService.sign(payload),
    };
  }


  async register(registerDto: CreateAuthDto) {
    return await this.usersService.handleRegister(registerDto);
  }

  async checkCode(codeDto: CodeAuthDto) {
    return await this.usersService.handleActive(codeDto);
  }

  async retryActive(email: string) {
    return await this.usersService.handleRetryActive(email);
  }

  async retryPassword(email: string) {
    return await this.usersService.handleRetryPassword(email);
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    return await this.usersService.handleChangePassword(changePasswordDto);
  }

}
