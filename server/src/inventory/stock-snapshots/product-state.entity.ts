import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { ParentProduct } from '../../parent-products/parent-product.entity';
import { Location } from '../locations/location.entity';
import { BusinessStatus } from '../business-statuses/business-status.entity';

@Entity('product_states')
@Unique(['parent_product_id', 'location_id', 'business_status_id'])
export class ProductState {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ParentProduct, { nullable: false })
    @JoinColumn({ name: 'parent_product_id' })
    parent_product: ParentProduct;

    @Column({ type: 'uuid' })
    parent_product_id: string;

    @ManyToOne(() => Location, { nullable: false })
    @JoinColumn({ name: 'location_id' })
    location: Location;

    @Column({ type: 'uuid' })
    location_id: string;

    @ManyToOne(() => BusinessStatus, { nullable: false })
    @JoinColumn({ name: 'business_status_id' })
    business_status: BusinessStatus;

    @Column({ type: 'uuid' })
    business_status_id: string;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @Column({ type: 'uuid', nullable: true })
    last_movement_id: string;

    @UpdateDateColumn()
    updated_at: Date;
}
