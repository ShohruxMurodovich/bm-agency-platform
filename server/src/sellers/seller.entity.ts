import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { SyncLog } from '../sync-logs/sync-log.entity';

@Entity('sellers')
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
