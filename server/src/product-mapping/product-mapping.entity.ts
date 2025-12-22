import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';
import { User } from '../users/user.entity';

@Entity('product_mapping')
export class ProductMapping {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ParentProduct, (product) => product.product_mappings, { nullable: false })
    @JoinColumn({ name: 'parent_product_id' })
    parent_product: ParentProduct;

    @Column({ nullable: false })
    parent_product_id: string;

    @OneToOne(() => MarketplaceProduct, (product) => product.product_mapping, { nullable: false })
    @JoinColumn({ name: 'marketplace_product_id' })
    marketplace_product: MarketplaceProduct;

    @Column({ unique: true, nullable: false })
    marketplace_product_id: string;

    @Column({ nullable: false })
    match_status: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'matched_by' })
    matched_by_user: User;

    @Column({ nullable: true })
    matched_by: string;

    @Column({ type: 'timestamptz', nullable: true })
    matched_at: Date;

    @CreateDateColumn()
    created_at: Date;
}
