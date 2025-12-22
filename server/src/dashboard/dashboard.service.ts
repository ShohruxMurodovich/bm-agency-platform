import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { ProductMovementRequest } from '../product-movement/product-movement-request.entity';
import { ParentProduct } from '../parent-products/parent-product.entity';
import { Seller } from '../sellers/seller.entity';
import { OrderItem } from '../order-items/order-item.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
        @InjectRepository(ProductMovementRequest)
        private movementsRepository: Repository<ProductMovementRequest>,
        @InjectRepository(ParentProduct)
        private productsRepository: Repository<ParentProduct>,
        @InjectRepository(Seller)
        private sellersRepository: Repository<Seller>,
    ) { }

    async getStats(user: User) {
        if (user.role === 'admin') {
            return this.getAdminStats();
        } else if (user.role === 'seller') {
            return this.getSellerStats(user);
        } else if (user.role === 'courier') {
            return this.getCourierStats(user);
        }
        return {};
    }

    private async getAdminStats() {
        // Revenue (sum of all completed order items) - Simplified for now
        const revenueQuery = await this.orderItemsRepository
            .createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .where('order.status = :status', { status: 'completed' })
            .select('SUM(item.price * item.quantity)', 'total')
            .getRawOne();

        const revenue = parseFloat(revenueQuery.total || '0');

        const activeOrders = await this.ordersRepository.count({
            where: [
                { status: 'processing' },
                { status: 'shipped' }
            ]
        });

        const totalProducts = await this.productsRepository.count();
        const activeSellers = await this.sellersRepository.count(); // TODO: Add 'active' status check if exists

        const recentOrders = await this.ordersRepository.find({
            order: { created_at: 'DESC' },
            take: 5,
            relations: ['order_items', 'order_items.marketplace_product', 'order_items.marketplace_product.product_mapping', 'order_items.marketplace_product.product_mapping.parent_product']
        });

        const mappedRecent = recentOrders.map(o => ({
            id: o.external_order_id,
            name: o.order_items[0]?.marketplace_product?.product_mapping?.parent_product?.product_name || o.order_items[0]?.marketplace_product?.title || 'Multiple Items',
            amount: o.order_items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toFixed(2),
            status: o.status
        }));

        return {
            stats: {
                revenue_value: '$' + revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                active_orders_value: activeOrders.toString(),
                total_products_value: totalProducts.toString(),
                active_sellers_value: activeSellers.toString()
            },
            recent_items: mappedRecent
        };
    }

    private async getSellerStats(user: User) {
        // Find seller for this user
        const seller = await this.sellersRepository.findOne({ where: { user_id: user.id } });
        if (!seller) return { stats: {}, recent_items: [] };

        // Revenue for this seller
        // We need to join OrderItem -> MarketplaceProduct -> Store -> Seller
        const revenueQuery = await this.orderItemsRepository
            .createQueryBuilder('item')
            .leftJoin('item.marketplace_product', 'mp')
            .leftJoin('mp.store', 'store')
            .leftJoin('item.order', 'order')
            .where('store.seller_id = :sellerId', { sellerId: seller.id })
            .andWhere('order.status = :status', { status: 'completed' })
            .select('SUM(item.price * item.quantity)', 'total')
            .getRawOne();

        const revenue = parseFloat(revenueQuery.total || '0');

        const activeOrders = await this.ordersRepository
            .createQueryBuilder('order')
            .leftJoin('order.store', 'store')
            .where('store.seller_id = :sellerId', { sellerId: seller.id })
            .andWhere('order.status IN (:...statuses)', { statuses: ['processing', 'shipped'] })
            .getCount();

        const pendingOrders = await this.ordersRepository
            .createQueryBuilder('order')
            .leftJoin('order.store', 'store')
            .where('store.seller_id = :sellerId', { sellerId: seller.id })
            .andWhere('order.status = :status', { status: 'pending' })
            .getCount();

        // Returns: movement requests of type 'return' created by this seller (or related to)
        const returnsCount = await this.movementsRepository.count({
            where: { seller_id: seller.id, type: 'return', status: 'pending' }
        });

        const recentOrders = await this.ordersRepository.find({
            where: { store: { seller_id: seller.id } },
            order: { created_at: 'DESC' },
            take: 5,
            relations: ['order_items', 'order_items.marketplace_product', 'order_items.marketplace_product.product_mapping', 'order_items.marketplace_product.product_mapping.parent_product']
        });

        const mappedRecent = recentOrders.map(o => ({
            id: o.external_order_id,
            name: o.order_items[0]?.marketplace_product?.product_mapping?.parent_product?.product_name || o.order_items[0]?.marketplace_product?.title || 'Multiple Items',
            amount: o.order_items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toFixed(2),
            status: o.status
        }));

        return {
            stats: {
                revenue_value: '$' + revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                active_orders_value: activeOrders.toString(),
                pending_orders_value: pendingOrders.toString(),
                returns_value: returnsCount.toString()
            },
            recent_items: mappedRecent
        };
    }

    private async getCourierStats(user: User) {
        // Pending Pickups: Send requests, status pending
        // ideally courier should see tasks assigned to them OR unassigned tasks in their region. 
        // For simplicity: see all pending 'send' requests as "Pending Pickups" or untaken jobs.
        // And assigned 'accepted' requests as active jobs.

        const pendingPickups = await this.movementsRepository.count({
            where: { type: 'send', status: 'pending' }
        });

        const activeDeliveries = await this.movementsRepository.count({
            where: [
                { type: 'send', status: 'accepted', courier_id: user.id },
                { type: 'send', status: 'partially_accepted', courier_id: user.id }
            ]
        });

        const returnsProcess = await this.movementsRepository.count({
            where: [
                { type: 'return', status: 'pending' }, // Returns waiting to be picked up/processed
                { type: 'return', status: 'accepted', courier_id: user.id }
            ]
        });

        const completedJobs = await this.movementsRepository.count({
            where: { courier_id: user.id, status: 'completed' } // Assuming there is a completed status, if not, use logic
        });

        // Recent Activity: Tasks assigned to this courier or open tasks
        const recentTasks = await this.movementsRepository.find({
            where: [
                { courier_id: user.id }, // My tasks
                { status: 'pending' }    // Open tasks
            ],
            order: { created_at: 'DESC' },
            take: 5,
            relations: ['seller', 'items', 'items.parent_product']
        });

        const mappedActivity = recentTasks.map(t => ({
            id: t.id,
            name: t.type === 'send' ? `Pickup from ${t.seller.name}` : `Return to ${t.seller.name}`,
            source: t.seller.name, // or address if available
            status: t.status,
            type: t.type
        }));

        return {
            stats: {
                pending_pickups_value: pendingPickups.toString(),
                active_deliveries_value: activeDeliveries.toString(),
                returns_process_value: returnsProcess.toString(),
                completed_jobs_value: completedJobs.toString()
            },
            recent_items: mappedActivity
        };
    }
}
