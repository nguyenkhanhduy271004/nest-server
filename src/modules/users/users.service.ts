import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { generateOtp, hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import { query } from 'express';
import mongoose from 'mongoose';
import { ChangePasswordDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) { }
  isEmailExist = async (email: string) => {
    const user = await this.UserModel.exists({ email });
    if (user) return true;
    return false;
  }
  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, phone, address, image } = createUserDto;
      const isExist = await this.isEmailExist(email);
      if (isExist) {
        throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác`);
      }
      const hashPassword = await hashPasswordHelper(password);
      const createdUser = await this.UserModel.create({
        name,
        email,
        password: hashPassword,
        phone,
        address,
        image
      })
      await createdUser.save();
      return {
        'status': 'success',
        'message': 'Create User Successfully'
      }
    } catch (error) {
      console.log(error);

    }
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;

    if (!current) current = 1;
    if (!pageSize) pageSize = 10;

    const totalItems = (await this.UserModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * (pageSize);

    const results = await this.UserModel
      .find(filter)
      .skip(skip)
      .limit(pageSize)
      .select("-password")
      .sort(sort as any)

    return { results, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.UserModel.findOne({ email });
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.UserModel.updateOne({ _id: updateUserDto._id }, { ...updateUserDto })
  }

  async remove(_id: string) {
    if (mongoose.isValidObjectId(_id)) {
      return await this.UserModel.deleteOne({ _id });
    } else {
      throw new BadRequestException("Id không đúng định dạng mongoose");
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    try {
      const { name, email, password } = registerDto;

      const isExist = await this.isEmailExist(email);
      if (isExist) {
        throw new BadRequestException(`Email đã tồn tại: ${email}. Vui lòng sử dụng email khác`);
      }

      const hashPassword = await hashPasswordHelper(password);
      const codeId = generateOtp()

      const createdUser = await this.UserModel.create({
        name,
        email,
        password: hashPassword,
        isActive: false,
        codeId: codeId,
        codeExpired: dayjs().add(+this.configService.get<string>('TIME_EXPIRED_CODE_ID'), 'minute')
      });

      if (!createdUser) {
        throw new InternalServerErrorException('Không thể tạo người dùng mới');
      }

      this.mailerService.sendMail({
        to: createdUser.email,
        subject: 'Activate your account',
        text: 'Welcome',
        template: 'register.hbs',
        context: {
          name: createdUser?.name ?? createdUser.email,
          activationCode: codeId
        }
      })
      return {
        _id: createdUser._id
      }


    } catch (error) {
      console.error('Error during user registration:', error);

      throw new InternalServerErrorException('Đã xảy ra lỗi trong quá trình đăng ký');
    }
  }

  async handleActive(data: CodeAuthDto) {
    const { _id, code } = data;

    try {
      const user = await this.UserModel.findOne({ _id, codeId: code });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isBeforeCheck = dayjs().isBefore(dayjs(user.codeExpired));
      if (!isBeforeCheck) {
        throw new BadRequestException('Code của bạn đã hết hạn hoặc không hợp lệ');
      } else {
        await this.UserModel.updateOne({ _id: data._id }, { isActive: true });
        return { isBeforeCheck };
      }
    } catch (error) {
      console.error('Error in handleActive:', error);
      throw new BadRequestException('An error occurred while activating user');
    }
  }

  async handleRetryActive(email: string) {
    const user = await this.UserModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại')
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã được kích hoạt')
    }
    const codeId = generateOtp()
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(+this.configService.get<string>('TIME_EXPIRED_CODE_ID'), 'minute')
    });

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Activate your account',
      text: 'Welcome',
      template: 'register.hbs',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId
      }
    })

    return { _id: user._id };
  }

  async handleRetryPassword(email: string) {
    const user = await this.UserModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại')
    }
    const codeId = generateOtp()
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(+this.configService.get<string>('TIME_EXPIRED_CODE_ID'), 'minute')
    });

    this.mailerService.sendMail({
      to: user.email,
      subject: 'Change your password account',
      text: 'Welcome',
      template: 'register.hbs',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId
      }
    })
    return { _id: user._id, email: user.email };
  }

  async handleChangePassword(changePasswordDto: ChangePasswordDto) {
    const { email, code, password, confirmPassword } = changePasswordDto;
    if (password !== confirmPassword) {
      throw new BadRequestException("Mật khẩu và nhập lại mật khẩu không chính xác")
    }
    const user = await this.UserModel.findOne({ email, codeId: code })
    if (!user) {
      throw new BadRequestException("Tài khoản không tồn tại")
    }
    const isBeforeCheck = dayjs().isBefore(dayjs(user.codeExpired));
    if (!isBeforeCheck) {
      throw new BadRequestException('Code của bạn đã hết hạn hoặc không hợp lệ');
    } else {
      const hashPassword = await hashPasswordHelper(password);
      await this.UserModel.updateOne({ email }, { password: hashPassword });
      return { email };
    }
  }

}
