import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ProductMovement } from './product-movement.entity';
import { User } from '../users/user.entity';
import { TenantScoped } from '../auth/tenant-scoped.decorator';

@Entity('movement_order_audit_logs')
@TenantScoped()
export class MovementOrderAuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index() // For efficient lookup by movement
    movement_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ nullable: true })
    old_value: string;

    @Column()
    new_value: string;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @ManyToOne(() => ProductMovement, { nullable: false })
    @JoinColumn({ name: 'movement_id' })
    movement: ProductMovement;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
