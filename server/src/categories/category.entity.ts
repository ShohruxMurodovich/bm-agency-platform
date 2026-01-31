import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum MarketplaceCategoryEnum {
    UZUM = 'UZUM',
    YANDEX = 'YANDEX',
    WB = 'WB',
}

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'enum', enum: MarketplaceCategoryEnum })
    marketplace: string;

    @Column({ type: 'text', nullable: true })
    category_name: string;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    fbs_commission: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    fbo_commission: number;
}
