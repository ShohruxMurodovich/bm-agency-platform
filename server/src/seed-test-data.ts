
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { SellersService } from './sellers/sellers.service';
import { StoresService } from './stores/stores.service';
import { ParentProductsService } from './parent-products/parent-products.service';
import { ProductMovementService } from './product-movement/product-movement.service';
import { UserRole } from './users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from './stores/store.entity';
import { ParentProduct } from './parent-products/parent-product.entity';
import { Seller } from './sellers/seller.entity';
import { ProductMovementRequest } from './product-movement/product-movement-request.entity';
import { ProductMovementItem } from './product-movement/product-movement-item.entity';
import { MarketplaceProduct } from './marketplace-products/marketplace-product.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './order-items/order-item.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
    console.log('🌱 Starting database seeding...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const usersService = app.get(UsersService);
    const sellersService = app.get(SellersService);
    const parentProductsRepo = app.get<Repository<ParentProduct>>(getRepositoryToken(ParentProduct));
    const storesRepo = app.get<Repository<Store>>(getRepositoryToken(Store));
    const sellersRepo = app.get<Repository<Seller>>(getRepositoryToken(Seller));
    const requestsRepo = app.get<Repository<ProductMovementRequest>>(getRepositoryToken(ProductMovementRequest));
    const movementService = app.get(ProductMovementService);
    const marketplaceProductsRepo = app.get<Repository<MarketplaceProduct>>(getRepositoryToken(MarketplaceProduct));
    const ordersRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
    const orderItemsRepo = app.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));

    console.log('🧹 Clearing old test data (optional)...');
    try {
        await orderItemsRepo.createQueryBuilder().delete().execute();
        await ordersRepo.createQueryBuilder().delete().execute();
        await marketplaceProductsRepo.createQueryBuilder().delete().execute();
        // Clear movements items first if possible, or cascade
        const movementItemsRepo = app.get<Repository<ProductMovementItem>>(getRepositoryToken(ProductMovementItem));
        await movementItemsRepo.createQueryBuilder().delete().execute();
        await requestsRepo.createQueryBuilder().delete().execute();

        await parentProductsRepo.createQueryBuilder().delete().execute();
        await storesRepo.createQueryBuilder().delete().execute();
        await sellersRepo.createQueryBuilder().delete().execute();
    } catch (e) {
        console.warn('Could not clear some tables', e);
    }

    // --- 1. Create Users ---
    const users = [
        { email: 'seller1@platform.com', role: UserRole.SELLER, name: 'John Seller' },
        { email: 'seller2@platform.com', role: UserRole.SELLER, name: 'Sarah Merchant' },
        { email: 'seller3@platform.com', role: UserRole.SELLER, name: 'Mike Vendor' },
        { email: 'courier1@platform.com', role: UserRole.COURIER, name: 'Fast Courier' },
        { email: 'courier2@platform.com', role: UserRole.COURIER, name: 'Swift Logistics' },
        { email: 'staff1@platform.com', role: UserRole.STAFF, name: 'Support Staff' }
    ];

    const userMap: Record<string, any> = {};

    for (const u of users) {
        let user = await usersService.findOneByEmail(u.email);
        if (!user) {
            console.log(`Creating user: ${u.email}`);
            user = await usersService.create({
                email: u.email,
                password_hash: 'admin123',
                role: u.role,
                name: u.name
            });
        }
        userMap[u.email] = user;
    }

    // --- 2. Create Sellers & Stores ---
    const sellerEmails = ['seller1@platform.com', 'seller2@platform.com', 'seller3@platform.com'];
    const sellerMap: Record<string, any> = {};

    const marketplaces = [
        { name: 'Amazon' },
        { name: 'Shopify' },
        { name: 'Wildberries' }
    ];

    for (const email of sellerEmails) {
        const user = userMap[email];
        const userConfig = users.find(u => u.email === email);
        const userName = userConfig ? userConfig.name : 'Unknown';

        let seller = await sellersService.findByUserId(user.id);
        if (!seller) {
            console.log(`Creating seller profile for ${email}`);
            seller = await sellersRepo.save({
                user_id: user.id,
                name: userName + ' LLC',
                phone: '+1234567890'
            });
        }
        sellerMap[email] = seller;

        // Create Stores
        const existingStores = await storesRepo.find({ where: { seller_id: seller.id } });
        if (existingStores.length === 0) {
            console.log(`Creating stores for ${seller.name}`);
            await storesRepo.save([
                {
                    seller_id: seller.id,
                    external_shop_id: `${seller.name}-amz`,
                    marketplace_id: 1,
                    name: `${seller.name} Amazon`
                },
                {
                    seller_id: seller.id,
                    external_shop_id: `${seller.name}-wb`,
                    marketplace_id: 2,
                    name: `${seller.name} Wildberries`
                }
            ]);
        }
    }

    // --- 3. Create Products ---
    console.log('📦 Creating products...');
    const productTypes = ['Headphones', 'Keyboard', 'Mouse', 'Monitor', 'Laptop Stand', 'Webcam', 'Microphone', 'Desk Lamp', 'Charger', 'Cable'];

    const products: any[] = [];

    for (const email of sellerEmails) {
        const seller = sellerMap[email];
        // Create 5 products per seller
        for (let i = 0; i < 5; i++) {
            const sellerFirstName = seller.name ? seller.name.split(' ')[0] : 'Generic';
            const productName = `${productTypes[i + (sellerEmails.indexOf(email) * 2) % productTypes.length]} ${sellerFirstName}`;
            const product = await parentProductsRepo.save({
                seller_id: seller.id,
                product_name: productName,
                sku: `SKU-${seller.id.substring(0, 4).toUpperCase()}-${i + 100}`,
                // manufacturer: 'Generic Factory', // Removed as it likely doesn't exist
                stock: Math.floor(Math.random() * 50),
                description: `High quality ${productName} for professionals.`
            });
            products.push(product);
        }

        // Create Marketplace Products for these stores (Linked to nothing or parent? Usually linked via ProductMapping but for now just existence)
        // We need them for Orders
        const stores = await storesRepo.find({ where: { seller_id: seller.id } });
        for (const store of stores) {
            const mpProducts: any[] = [];
            for (let i = 0; i < 5; i++) {
                const mp = await marketplaceProductsRepo.save({
                    store_id: store.id,
                    external_product_id: `EXT-${store.external_shop_id}-${i}`,
                    title: `Marketplace Item ${i} (${store.marketplace_id === 1 ? 'WB' : 'Amz'})`,
                    raw_payload: {},
                    last_seen_at: new Date()
                });
                mpProducts.push(mp);
            }

            // Create Orders for this store
            console.log(`Creating orders for store ${store.name}`);
            for (let k = 0; k < 3; k++) {
                const order = await ordersRepo.save({
                    store_id: store.id,
                    external_order_id: `ORD-${Date.now()}-${k}`,
                    status: k === 0 ? 'pending' : (k === 1 ? 'shipped' : 'completed'),
                    created_at: new Date()
                });

                // Create Order Items
                await orderItemsRepo.save({
                    order_id: order.id,
                    marketplace_product_id: mpProducts[0].id,
                    quantity: 2,
                    price: 29.99
                });
                await orderItemsRepo.save({
                    order_id: order.id,
                    marketplace_product_id: mpProducts[1].id,
                    quantity: 1,
                    price: 19.50
                });
            }
        }
    }

    // --- 4. Create Product Movements ---
    console.log('🚚 Creating product movements...');

    // Scenario 1: Seller 1 sends products (Pending)
    const s1 = sellerMap['seller1@platform.com'];
    const s1Products = await parentProductsRepo.find({ where: { seller_id: s1.id } });
    if (s1Products.length > 0) {
        const p1 = s1Products[0];
        const p2 = s1Products[1];

        await movementService.createSendRequest(userMap['seller1@platform.com'].id, {
            products: [
                { parent_product_id: p1.id, quantity: 10 },
                { parent_product_id: p2.id, quantity: 5 }
            ],
            notes: 'Restocking for Q4 sales'
        });
        console.log('Created Send Request (Pending)');
    }

    // Scenario 2: Seller 2 returns products (Pending return from courier)
    // Wait... usually a "Return" request is initiated by the Courier (Customer Return) OR Seller (Defective removal).
    // Based on our flow: Courier -> Return Products page -> "Create Return".
    // So Courier creates a request to return items to Seller.

    const c1 = userMap['courier1@platform.com'];
    const s2 = sellerMap['seller2@platform.com'];
    const s2Products = await parentProductsRepo.find({ where: { seller_id: s2.id } });

    if (s2Products.length > 0) {
        // We need to inject the method or use service directly but usually endpoints handle this. 
        // Let's create via repository to simulate "Courier created it"
        // Actually, the service likely has createReturnRequest
        // But verifying service signature... we didn't check createReturnRequest. 
        // Assuming it's similar layout. Let's check service again or just assume standard creation via Repo.

        const req = requestsRepo.create({
            type: 'return',
            seller_id: s2.id,
            created_by: c1.id,
            created_by_user: c1,
            status: 'pending',
            notes: 'Customer refused delivery, damaged box',
            created_at: new Date()
        });
        const savedReq = await requestsRepo.save(req);

        // Add items manually
        const itemsRepo = app.get<Repository<ProductMovementItem>>(getRepositoryToken(ProductMovementItem));

        await itemsRepo.save({
            request_id: savedReq.id,
            parent_product_id: s2Products[0].id,
            requested_quantity: 1,
            status: 'pending'
        });
        console.log('Created Return Request (Pending)');
    }

    console.log('✅ Seeding complete!');
    await app.close();
}

bootstrap();
