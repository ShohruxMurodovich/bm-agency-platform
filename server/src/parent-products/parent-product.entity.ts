import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { ProductMapping } from '../product-mapping/product-mapping.entity';
import { Inventory } from '../inventory/inventory.entity';

@Entity('parent_products')
export class ParentProduct {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Seller, (seller) => seller.parent_products, { nullable: false })
    @JoinColumn({ name: 'seller_id' })
    seller: Seller;

    @Column({ type: 'uuid', nullable: false })
    seller_id: string;

    @Column({ nullable: false })
    product_name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    cost_usd: number;

    @Column({ type: 'bigint', nullable: true })
    cost_uzs: string;

    @Column({ type: 'integer', default: 0 })
    stock: number;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @OneToMany(() => ProductMapping, (mapping) => mapping.parent_product)
    product_mappings: ProductMapping[];

    @OneToMany(() => Inventory, (inventory) => inventory.parent_product)
    inventory: Inventory[];
}
