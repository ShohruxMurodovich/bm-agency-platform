import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProfitMonitoring } from './profit-monitoring.entity';

export interface ProfitMonitoringQuery {
    marketplace?: string;
    search?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class ProfitMonitoringService {
    constructor(
        @InjectRepository(ProfitMonitoring)
        private readonly repo: Repository<ProfitMonitoring>,
    ) { }

    /**
     * findAll with optional tenant filtering by seller_id.
     * Admin sees all; Seller/Public sees only rows matching their seller_id.
     */
    async findAll(query: ProfitMonitoringQuery, sellerId?: string) {
        const { marketplace, search, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const qb = this.repo.createQueryBuilder('pm');

        // Tenant isolation: non-admin users only see their own data
        if (sellerId) {
            qb.andWhere('pm.seller_id = :sellerId', { sellerId });
        }

        if (marketplace) {
            qb.andWhere('pm.marketplace = :marketplace', { marketplace });
        }

        if (search) {
            const normalized = search.trim().replace(/\s+/g, ' ');
            qb.andWhere(
                '(pm.product_name ILIKE :search OR pm.sku_id ILIKE :search)',
                { search: `%${normalized}%` },
            );
        }

        qb.orderBy('pm.sell_price', 'DESC', 'NULLS LAST');
        qb.skip(skip).take(limit);

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    /**
     * getSummary with optional tenant filtering by seller_id.
     */
    async getSummary(sellerId?: string) {
        const qb = this.repo
            .createQueryBuilder('pm')
            .select('pm.marketplace', 'marketplace')
            .addSelect('COUNT(*)', 'total_skus')
            .addSelect('AVG(pm.sell_price)', 'avg_price')
            .addSelect('SUM(pm.payout)', 'total_payout')
            .addSelect('SUM(pm.commission)', 'total_commission')
            .addSelect('SUM(pm.logistics_fee)', 'total_logistics')
            .addSelect('SUM(pm.margin)', 'total_margin');

        if (sellerId) {
            qb.where('pm.seller_id = :sellerId', { sellerId });
        }

        qb.groupBy('pm.marketplace');

        return qb.getRawMany();
    }
}
