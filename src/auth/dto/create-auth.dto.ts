import { IsEmail, IsNotEmpty, IsOptional } from "class-validator"

export class CreateAuthDto {

    @IsNotEmpty({ message: "Vui lòng nhập email" })
    @IsEmail({}, { message: "Email không hợp đúng định dạng" })
    email: string;

    @IsNotEmpty({ message: "Vui lòng nhập mật khẩu" })
    password: string;

    @IsOptional()
    name: string;
}

export class CodeAuthDto {

    @IsNotEmpty({ message: "Id không được để trống" })
    _id: string;

    @IsNotEmpty({ message: "Code không được để trống" })
    code: string;

}

export class ChangePasswordDto {

    @IsNotEmpty({ message: "Email không được để trống" })
    email: string;

    @IsNotEmpty({ message: "Code không được để trống" })
    code: string;

    @IsNotEmpty({ message: "Password không được để trống" })
    password: string;

    @IsNotEmpty({ message: "Confirm password không được để trống" })
    confirmPassword: string;

}
