import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { ProductMovement } from './product-movement.entity';
import { User } from '../users/user.entity';
import { TenantScoped } from '../auth/tenant-scoped.decorator';

@Entity('movement_order_mappings')
@TenantScoped()
@Unique(['movement_id']) // CRITICAL: Ensures one active mapping per movement
export class MovementOrderMapping {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    @Index() // For efficient lookup
    movement_id: string;

    @Column()
    @Index() // For autocomplete and search
    order_number: string;

    @Column({ type: 'uuid' })
    created_by: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    @Column({ type: 'text', nullable: true })
    comment: string;

    // Relations
    @ManyToOne(() => ProductMovement, { nullable: false })
    @JoinColumn({ name: 'movement_id' })
    movement: ProductMovement;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updater: User;
}
