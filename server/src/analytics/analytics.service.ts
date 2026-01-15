import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(ParentProduct)
        private parentProductsRepository: Repository<ParentProduct>,
    ) { }

    /**
     * Get analytics overview for a seller
     */
    async getOverview(sellerId: string) {
        // Get orders stats
        const allOrders = await this.ordersRepository
            .createQueryBuilder('order')
            .leftJoin('order.store', 'store')
            .where('store.seller_id = :sellerId', { sellerId })
            .getMany();

        const totalOrders = allOrders.length;

        // Orders this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthOrders = allOrders.filter(order =>
            new Date(order.created_at) >= startOfMonth
        ).length;

        // Pending orders
        const pendingOrders = allOrders.filter(order =>
            order.status === 'pending' || order.status === 'processing'
        ).length;

        // Revenue calculation (sum of order totals)
        const totalRevenue = allOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.total_amount?.toString() || '0'));
        }, 0);

        const thisMonthRevenue = allOrders
            .filter(order => new Date(order.created_at) >= startOfMonth)
            .reduce((sum, order) => {
                return sum + (parseFloat(order.total_amount?.toString() || '0'));
            }, 0);

        // Inventory stats
        const products = await this.parentProductsRepository.find({
            where: { seller_id: sellerId, is_archived: false }
        });

        const totalProducts = products.length;
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
        const lowStockItems = products.filter(p => (p.stock || 0) < 10).length;

        return {
            orders: {
                total: totalOrders,
                this_month: thisMonthOrders,
                pending: pendingOrders,
            },
            revenue: {
                total: Math.round(totalRevenue * 100) / 100,
                this_month: Math.round(thisMonthRevenue * 100) / 100,
                currency: 'USD',
            },
            inventory: {
                total_products: totalProducts,
                total_stock: totalStock,
                low_stock_items: lowStockItems,
            }
        };
    }
}
