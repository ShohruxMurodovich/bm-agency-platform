import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async create(userData: Partial<User>): Promise<User> {
        const salt = await bcrypt.genSalt(10);
        const passwordToHash = userData.password_hash || 'defaultPassword';
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);

        const newUser = this.usersRepository.create({
            ...userData,
            password_hash: hashedPassword,
        });
        return this.usersRepository.save(newUser);
    }

    async update(id: string, userData: Partial<User>): Promise<User | null> {
        if (userData.password_hash) {
            const salt = await bcrypt.genSalt(10);
            userData.password_hash = await bcrypt.hash(userData.password_hash, salt);
        }
        await this.usersRepository.update(id, userData);
        return this.findOneById(id);
    }

    async remove(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }
}
