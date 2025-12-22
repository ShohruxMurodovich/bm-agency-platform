import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    STAFF = 'staff',
    SELLER = 'seller',
    COURIER = 'courier',
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

    @CreateDateColumn()
    created_at: Date;
}
