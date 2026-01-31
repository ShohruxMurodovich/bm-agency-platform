import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../orders/order.entity';
import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.order_items, { nullable: false })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ nullable: false })
    order_id: string;

    @ManyToOne(() => MarketplaceProduct, (product) => product.order_items, { nullable: false })
    @JoinColumn({ name: 'marketplace_product_id' })
    marketplace_product: MarketplaceProduct;

    @Column({ nullable: false })
    marketplace_product_id: string;

    @Column({ type: 'bigint', nullable: true })
    sku_id: number;

    @Column({ type: 'bigint', nullable: true })
    barcode: number;

    @Column({ type: 'int', nullable: false })
    quantity: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
    price: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    cost_usd: number;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    cost_uzs: number;
}
