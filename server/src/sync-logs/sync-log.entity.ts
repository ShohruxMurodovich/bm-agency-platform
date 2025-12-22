import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Marketplace } from '../marketplaces/marketplace.entity';

@Entity('sync_logs')
export class SyncLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Seller, (seller) => seller.sync_logs, { nullable: false })
    @JoinColumn({ name: 'seller_id' })
    seller: Seller;

    @Column({ nullable: false })
    seller_id: string;

    @ManyToOne(() => Marketplace, (marketplace) => marketplace.sync_logs, { nullable: false })
    @JoinColumn({ name: 'marketplace_id' })
    marketplace: Marketplace;

    @Column({ type: 'smallint', nullable: false })
    marketplace_id: number;

    @Column({ nullable: false })
    entity_type: string;

    @Column({ nullable: true })
    entity_id: string;

    @Column({ nullable: false })
    status: string;

    @Column({ type: 'text', nullable: true })
    error_message: string;

    @Column({ type: 'jsonb', nullable: true })
    payload: any;

    @CreateDateColumn()
    created_at: Date;
}
