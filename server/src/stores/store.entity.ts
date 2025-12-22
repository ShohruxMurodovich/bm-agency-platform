import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Marketplace } from '../marketplaces/marketplace.entity';
import { StoreCredential } from '../store-credentials/store-credential.entity';
import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';
import { Order } from '../orders/order.entity';

@Entity('stores')
@Index(['seller_id', 'marketplace_id', 'external_shop_id'], { unique: true })
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Seller, (seller) => seller.stores, { nullable: false })
    @JoinColumn({ name: 'seller_id' })
    seller: Seller;

    @Column({ nullable: false })
    seller_id: string;

    @ManyToOne(() => Marketplace, (marketplace) => marketplace.stores, { nullable: false })
    @JoinColumn({ name: 'marketplace_id' })
    marketplace: Marketplace;

    @Column({ type: 'smallint', nullable: false })
    marketplace_id: number;

    @Column({ nullable: false })
    external_shop_id: string;

    @Column({ nullable: true }) // nullable true initially for migration safety, or default
    name: string;

    @Column({ nullable: true })
    store_name: string;

    @CreateDateColumn()
    created_at: Date;

    // Relations
    @OneToMany(() => StoreCredential, (credential) => credential.store)
    store_credentials: StoreCredential[];

    @OneToMany(() => MarketplaceProduct, (product) => product.store)
    marketplace_products: MarketplaceProduct[];

    @OneToMany(() => Order, (order) => order.store)
    orders: Order[];
}
