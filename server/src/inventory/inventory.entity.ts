import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';

@Entity('inventory')
@Index(['seller_id', 'parent_product_id'], { unique: true })
export class Inventory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Seller, (seller) => seller.inventory, { nullable: false })
    @JoinColumn({ name: 'seller_id' })
    seller: Seller;

    @Column({ nullable: false })
    seller_id: string;

    @ManyToOne(() => ParentProduct, (product) => product.inventory, { nullable: false })
    @JoinColumn({ name: 'parent_product_id' })
    parent_product: ParentProduct;

    @Column({ nullable: false })
    parent_product_id: string;

    @Column({ type: 'int', nullable: false })
    quantity: number;

    @UpdateDateColumn()
    updated_at: Date;
}
