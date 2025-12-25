import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum LocationType {
    SELLER_WAREHOUSE = 'SELLER_WAREHOUSE',
    BM_WAREHOUSE = 'BM_WAREHOUSE',
    MARKETPLACE_WAREHOUSE = 'MARKETPLACE_WAREHOUSE',
    MARKETPLACE_RETURN_BUFFER = 'MARKETPLACE_RETURN_BUFFER',
    RETURN_BUFFER = 'RETURN_BUFFER', // Added generic return buffer
    DAMAGED_BUFFER = 'DAMAGED_BUFFER',
    LOST = 'LOST',
    UNKNOWN = 'UNKNOWN',
    SOLD = 'SOLD', // Virtual location for sold items
}

export enum OwnerType {
    SYSTEM = 'SYSTEM',
    SELLER = 'SELLER',
    MARKETPLACE = 'MARKETPLACE',
}

@Entity('locations')
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: LocationType,
    })
    location_type: LocationType;

    @Column({
        type: 'enum',
        enum: OwnerType,
        default: OwnerType.SYSTEM
    })
    owner_type: OwnerType;

    @Column({ nullable: true })
    owner_id: string;

    @Column({ default: false })
    is_virtual: boolean;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;
}
