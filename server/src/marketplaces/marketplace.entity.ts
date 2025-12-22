import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Store } from '../stores/store.entity';
import { SyncLog } from '../sync-logs/sync-log.entity';

@Entity('marketplaces')
export class Marketplace {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    // Relations
    @OneToMany(() => Store, (store) => store.marketplace)
    stores: Store[];

    @OneToMany(() => SyncLog, (log) => log.marketplace)
    sync_logs: SyncLog[];
}
