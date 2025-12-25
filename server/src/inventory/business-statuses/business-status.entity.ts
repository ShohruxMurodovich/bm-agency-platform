import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum StatusType {
    FREE = 'FREE',
    READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
    SENT = 'SENT',
    PAID = 'PAID',
    RETURN_REQUESTED = 'RETURN_REQUESTED',
    RETURN_RECEIVED = 'RETURN_RECEIVED',
    RETURNED_TO_SELLER = 'RETURNED_TO_SELLER',
    DAMAGED = 'DAMAGED',
    UNKNOWN = 'UNKNOWN',
    LOST = 'LOST',
}

@Entity('business_statuses')
export class BusinessStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    description: string;

    @Column({ default: false })
    is_final: boolean;

    @Column({ default: false })
    blocks_operations: boolean;

    @Column({ default: false })
    requires_issue: boolean;

    @CreateDateColumn()
    created_at: Date;
}
