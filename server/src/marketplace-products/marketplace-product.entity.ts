import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Store } from '../stores/store.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import { OrderItem } from '../order-items/order-item.entity';

export enum MarketplaceCodeEnum {
    U = 'U',
    Y = 'Y',
    W = 'W',
}

@Entity('marketplace_products')
@Index(['store_id', 'sku_id'], { unique: true })
@Index(['store_id', 'external_product_id'], { unique: true })
export class MarketplaceProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Store, (store) => store.marketplace_products, { nullable: false })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ nullable: false })
    store_id: string;

    @Column({ type: 'bigint', nullable: true })
    sku_id: number;

    @Column({ type: 'enum', enum: MarketplaceCodeEnum, nullable: true })
    marketplace: string;

    @Column({ type: 'bigint', nullable: true })
    product_id: number;

    @Column({ nullable: true })
    sku_name: string;

    @Column({ nullable: false })
    external_product_id: string;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: true })
    product_title: string;

    @Column({ type: 'bigint', nullable: true })
    barcode: number;

    @Column({ type: 'int', nullable: true })
    price: number;

    @Column({ type: 'int', nullable: true })
    stock_fbs: number;

    @Column({ type: 'int', nullable: true })
    stock_fbo: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    logistics_fee_fbs_uzs: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    logistics_fee_fbo_uzs: number;

    @Column({ type: 'int', nullable: true })
    category_id: number;

    @Column({ type: 'text', nullable: true })
    image: string;

    @Column({ type: 'text', nullable: true })
    preview_image: string;

    @Column({ type: 'text', nullable: true })
    status: string;

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
