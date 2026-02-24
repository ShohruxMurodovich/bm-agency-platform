import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('profit_monitoring')
export class ProfitMonitoring {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    marketplace: string;

    @Column({ nullable: true })
    marketplace_id: string;

    @Column({ nullable: true })
    sku_id: string;

    @Column({ nullable: true })
    product_name: string;

    @Column({ type: 'numeric', nullable: true })
    sell_price: number;

    @Column({ type: 'numeric', nullable: true })
    commission: number;

    @Column({ type: 'numeric', nullable: true })
    logistics_fee: number;

    @Column({ type: 'numeric', nullable: true })
    payout: number;

    @Column({ type: 'numeric', nullable: true })
    margin: number;

    @Column({ nullable: true })
    seller_id: string;

    @Column({ type: 'timestamptz', nullable: true })
    synced_at: Date;
}
