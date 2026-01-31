import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Store } from '../stores/store.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { TenantScoped } from '../auth/tenant-scoped.decorator';

@Entity('orders')
@TenantScoped()
@Index(['store_id', 'external_order_id'], { unique: true })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Store, (store) => store.orders, { nullable: false })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ nullable: false })
    store_id: string;

    @Column({ nullable: false })
    external_order_id: string;

    @Column({ nullable: false })
    invoiceNumber: string;

    @Column({ nullable: false })
    status: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    @Column({ type: 'bigint', nullable: true })
    deliver_until: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relations
    @OneToMany(() => OrderItem, (item) => item.order)
    order_items: OrderItem[];
}
