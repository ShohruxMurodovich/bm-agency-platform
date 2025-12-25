import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Location } from '../inventory/locations/location.entity';
import { BusinessStatus } from '../inventory/business-statuses/business-status.entity';

export enum MovementType {
    SELLER_TO_BM = 'SELLER_TO_BM',
    BM_TO_MARKETPLACE = 'BM_TO_MARKETPLACE',
    MARKETPLACE_SALE = 'MARKETPLACE_SALE',
    CUSTOMER_RETURN = 'CUSTOMER_RETURN',
    MARKETPLACE_TO_BM_RETURN = 'MARKETPLACE_TO_BM_RETURN',
    BM_TO_SELLER = 'BM_TO_SELLER',
    WRITE_OFF = 'WRITE_OFF',
    ADJUSTMENT = 'ADJUSTMENT',
    STATUS_CHANGE = 'STATUS_CHANGE',
}

export enum InitiatorType {
    SYSTEM = 'SYSTEM',
    USER = 'USER',
}

@Entity('product_movements')
export class ProductMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    occurred_at: Date;

    @CreateDateColumn()
    recorded_at: Date;

    @ManyToOne(() => ParentProduct, { nullable: false })
    @JoinColumn({ name: 'parent_product_id' })
    parent_product: ParentProduct;

    @Column({ type: 'uuid' })
    parent_product_id: string;

    // Optional specific item tracking (future proofing)
    @Column({ nullable: true })
    product_id: string;

    @ManyToOne(() => Location, { nullable: false })
    @JoinColumn({ name: 'from_location_id' })
    from_location: Location;

    @Column({ type: 'uuid' })
    from_location_id: string;

    @ManyToOne(() => Location, { nullable: false })
    @JoinColumn({ name: 'to_location_id' })
    to_location: Location;

    @Column({ type: 'uuid' })
    to_location_id: string;

    @ManyToOne(() => BusinessStatus, { nullable: false })
    @JoinColumn({ name: 'from_status_id' })
    from_status: BusinessStatus;

    @Column({ type: 'uuid' })
    from_status_id: string;

    @ManyToOne(() => BusinessStatus, { nullable: false })
    @JoinColumn({ name: 'to_status_id' })
    to_status: BusinessStatus;

    @Column({ type: 'uuid' })
    to_status_id: string;

    @Column({ type: 'int' })
    quantity: number;

    @Column({
        type: 'enum',
        enum: MovementType,
    })
    movement_type: MovementType;

    @Column({ nullable: true })
    document_id: string;

    @Column({ nullable: true })
    external_reference: string;

    @Column({
        type: 'enum',
        enum: InitiatorType,
        default: InitiatorType.SYSTEM
    })
    initiator_type: InitiatorType;

    @Column({ nullable: true })
    initiator_id: string;

    @Column({ nullable: true })
    reason_code: string;

    @Column({ nullable: true })
    comment: string;

    @Column({ default: false })
    is_reversal: boolean;

    @Column({ nullable: true })
    reversed_movement_id: string;
}
