import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../stores/store.entity';

@Entity('store_credentials')
export class StoreCredential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Store, (store) => store.store_credentials, { nullable: false })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ nullable: false })
    store_id: string;

    @Column({ nullable: false })
    token: string;

    @Column({ default: true, nullable: false })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
