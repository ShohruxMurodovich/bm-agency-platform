import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Marketplace } from '../marketplaces/marketplace.entity';
import { StoreCredential } from '../store-credentials/store-credential.entity';
import { MarketplaceProduct } from '../marketplace-products/marketplace-product.entity';
import { Order } from '../orders/order.entity';
import { TenantScoped } from '../auth/tenant-scoped.decorator';

export enum MarketplaceEnum {
    U = 'U',
    Y = 'Y',
    W = 'W',
}

export enum ConnectionStatus {
    CONNECTED = 'connected',
    EXPIRED = 'expired',
    DISABLED = 'disabled',
}

@Entity('stores')
@TenantScoped()
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

    @Column({ type: 'enum', enum: MarketplaceEnum, nullable: true })
    marketplace_code: string;

    @Column({ nullable: false })
    external_shop_id: string;

    /** User-defined display name — e.g. "Store A Uzum" */
    @Column({ nullable: true })
    display_name: string;

    /** Store name returned by the marketplace API — e.g. "Uzum Official Store" */
    @Column({ nullable: true })
    marketplace_store_name: string;

    // ── AES-256-GCM encrypted token ─────────────────────────
    @Column({ type: 'text', nullable: true })
    encrypted_token: string;

    @Column({ type: 'text', nullable: true })
    token_iv: string;

    @Column({ type: 'text', nullable: true })
    token_auth_tag: string;

    // ── Connection status ────────────────────────────────────
    @Column({
        type: 'varchar',
        default: ConnectionStatus.CONNECTED,
        nullable: false,
    })
    connection_status: ConnectionStatus;

    // ── Legacy fields (kept for backward compat) ─────────────
    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    store_name: string;

    @Column({ nullable: true })
    token: string;

    @CreateDateColumn()
    created_at: Date;

    @DeleteDateColumn({ nullable: true })
    deleted_at: Date;

    // ── Relations ────────────────────────────────────────────
    @OneToMany(() => StoreCredential, (credential) => credential.store)
    store_credentials: StoreCredential[];

    @OneToMany(() => MarketplaceProduct, (product) => product.store)
    marketplace_products: MarketplaceProduct[];

    @OneToMany(() => Order, (order) => order.store)
    orders: Order[];
}
