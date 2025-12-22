import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Store } from '../stores/store.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import { OrderItem } from '../order-items/order-item.entity';

@Entity('marketplace_products')
@Index(['store_id', 'external_product_id'], { unique: true })
export class MarketplaceProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Store, (store) => store.marketplace_products, { nullable: false })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ nullable: false })
    store_id: string;

    @Column({ nullable: false })
    external_product_id: string;

    @Column({ nullable: false })
    title: string;

    @Column({ type: 'jsonb', nullable: false })
    raw_payload: any;

    @UpdateDateColumn()
    last_seen_at: Date;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @OneToMany(() => ProductMapping, (mapping) => mapping.marketplace_product)
    product_mapping: ProductMapping;

    @OneToMany(() => OrderItem, (item) => item.marketplace_product)
    order_items: OrderItem[];
}
