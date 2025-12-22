import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductMovementRequest } from './product-movement-request.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';

@Entity('product_movement_items')
export class ProductMovementItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => ProductMovementRequest, request => request.items, { nullable: false })
    @JoinColumn({ name: 'request_id' })
    request: ProductMovementRequest;

    @Column({ type: 'uuid', nullable: false })
    request_id: string;

    @ManyToOne(() => ParentProduct, { nullable: false })
    @JoinColumn({ name: 'parent_product_id' })
    parent_product: ParentProduct;

    @Column({ type: 'uuid', nullable: false })
    parent_product_id: string;

    @Column({ type: 'integer', nullable: false })
    requested_quantity: number;

    @Column({ type: 'integer', default: 0, nullable: false })
    accepted_quantity: number;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'partially_accepted', 'rejected'],
        default: 'pending'
    })
    status: string;
}
