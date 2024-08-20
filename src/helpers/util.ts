const bcrypt = require('bcrypt');
import { v4 as uuidv4 } from 'uuid';
const saltRounds = 10;

export const hashPasswordHelper = async (plainPassword: string) => {
    try {
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        return hash;
    } catch (error) {
        console.log(error);
    }
};

export const comparePassword = async (plainPassword: string, hashPassword: string) => {
    try {
        return await bcrypt.compare(plainPassword, hashPassword);
    } catch (error) {
        console.log(error);
    }
}

export function generateOtp() {
    const uuid = uuidv4();
    const digits = uuid.replace(/\D/g, '');
    const otp = digits.substring(0, 4);
    return otp;
}

