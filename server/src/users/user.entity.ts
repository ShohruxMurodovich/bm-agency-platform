import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
    SELLER = 'seller',
    COURIER = 'courier',
    PUBLIC_USER = 'public_user',
}

export enum SubscriptionPlan {
    FREE = 'FREE',
    STARTER = 'STARTER',
    PREMIUM = 'PREMIUM',
    VIP = 'VIP',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: false })
    email: string;

    @Column({ nullable: false })
    password_hash: string;

    @Column({ type: 'text', nullable: false })
    role: string;

    @Column({ type: 'text', nullable: true })
    name: string;

    @Column({ type: 'enum', enum: SubscriptionPlan, nullable: true })
    subscription_plan: SubscriptionPlan;

    @Column({ type: 'timestamptz', nullable: true })
    trial_ends_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
