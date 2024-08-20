import { Controller, Request, Post, UseGuards, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public } from './decorator/customize';
import { ChangePasswordDto, CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResponseMessage } from '@/decorator/customize';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @Public()
  @Post('login')
  @ResponseMessage("Fetch Login")
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return await this.authService.login(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @ResponseMessage("Fetch Register")
  @Post('register')
  async register(@Body() registerDto: CreateAuthDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @ResponseMessage("Fetch Check Code")
  @Post('check-code')
  async checkCode(@Body() codeDto: CodeAuthDto) {
    return await this.authService.checkCode(codeDto);
  }

  @Public()
  @Post('retry-active')
  async retryActive(@Body("email") email: string) {
    return await this.authService.retryActive(email);
  }

  @Public()
  @Post('retry-password')
  async retryPassword(@Body("email") email: string) {
    return await this.authService.retryPassword(email);
  }

  @Public()
  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(changePasswordDto);
  }

  @Get('mail')
  @Public()
  testMail() {
    this.mailerService.sendMail({
      to: 'bogiaoffline@gmail.com',
      subject: 'Testing Nest MailerModule ✔',
      text: 'welcome',
      template: 'register.hbs',
      context: {
        name: 'Nguyen Duy',
        activationCode: 123456
      }
    })
      .then(() => 'test mail ok')
      .catch((error) => {
        console.error('Error sending email:', error);
        return 'test mail not ok';
      });
  }





}
