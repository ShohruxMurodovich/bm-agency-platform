import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { SyncLog } from '../sync-logs/sync-log.entity';
import { TenantScoped } from '../auth/tenant-scoped.decorator';

@Entity('sellers')
@TenantScoped()
@Index(['user_id'], { unique: true })
@Index(['created_at'])
export class Seller {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ unique: true, nullable: false })
    user_id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    phone_number: string;

    @Column({ type: 'integer', default: 5 })
    max_stores: number;

    @Column({ type: 'boolean', default: false })
    is_public_saas_user: boolean;

    @Column({ type: 'boolean', default: false })
    is_archived: boolean;

    @Column({ type: 'boolean', default: false })
    onboarding_completed: boolean;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @OneToMany(() => Store, (store) => store.seller)
    stores: Store[];

    @OneToMany(() => ParentProduct, (product) => product.seller)
    parent_products: ParentProduct[];

    @OneToMany(() => Inventory, (inventory) => inventory.seller)
    inventory: Inventory[];

    @OneToMany(() => SyncLog, (log) => log.seller)
    sync_logs: SyncLog[];
}
