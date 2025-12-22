import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { User } from '../users/user.entity';
import type { ProductMovementItem } from './product-movement-item.entity';

@Entity('product_movement_requests')
export class ProductMovementRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: ['send', 'return']
    })
    type: 'send' | 'return';

    @ManyToOne(() => Seller, { nullable: false })
    @JoinColumn({ name: 'seller_id' })
    seller: Seller;

    @Column({ type: 'uuid', nullable: false })
    seller_id: string;

    // Set ONLY on acceptance
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'courier_id' })
    courier: User;

    @Column({ type: 'uuid', nullable: true })
    courier_id: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'partially_accepted', 'rejected', 'cancelled'],
        default: 'pending'
    })
    status: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    created_by_user: User;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'accepted_by' })
    accepted_by_user: User;

    @Column({ type: 'uuid', nullable: true })
    accepted_by: string;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    accepted_at: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // Relations
    @OneToMany('ProductMovementItem', (item: ProductMovementItem) => item.request, { cascade: true })
    items: ProductMovementItem[];
}
