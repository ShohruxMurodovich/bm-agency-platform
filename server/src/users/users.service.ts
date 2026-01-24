import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionPlan } from './user.entity';
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
        const newUser = this.usersRepository.create(userData);
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

    /**
     * Check if user's trial has expired and downgrade to FREE plan if necessary
     */
    async checkAndHandleExpiredTrial(user: User): Promise<User> {
        // Only check for users with trial_ends_at set
        if (!user.trial_ends_at) {
            return user;
        }

        const now = new Date();
        const trialEnd = new Date(user.trial_ends_at);

        // If trial has expired and user is still on PREMIUM
        if (now > trialEnd && user.subscription_plan === SubscriptionPlan.PREMIUM) {
            // Downgrade to FREE plan
            user.subscription_plan = SubscriptionPlan.FREE;
            user.trial_ends_at = null; // Clear trial date

            await this.usersRepository.save(user);
        }

        return user;
    }
}
