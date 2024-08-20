import { IsEmail, IsEmpty, IsNotEmpty } from "class-validator";

export class CreateUserDto {

    @IsNotEmpty({ message: 'Tên không được để trống' })
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    phone: string;
    address: string;
    image: string;

}
