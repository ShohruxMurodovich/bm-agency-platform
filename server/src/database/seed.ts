import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// This script will:
// 1. Clear ALL existing data
// 2. Create comprehensive fake data for testing

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: 5432,
        username: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'platform_db',
        entities: ['src/**/*.entity.ts'],
        synchronize: false,
    });

    await dataSource.initialize();
    console.log('🔗 Database connected');

    try {
        // Step 1: Clear all data (in reverse dependency order)
        console.log('🗑️  Clearing existing data...');

        await dataSource.query('TRUNCATE TABLE product_movements CASCADE');
        await dataSource.query('TRUNCATE TABLE product_states CASCADE');
        await dataSource.query('TRUNCATE TABLE order_items CASCADE');
        await dataSource.query('TRUNCATE TABLE orders CASCADE');
        await dataSource.query('TRUNCATE TABLE sync_logs CASCADE');
        await dataSource.query('TRUNCATE TABLE product_mapping CASCADE');
        await dataSource.query('TRUNCATE TABLE inventory CASCADE');
        await dataSource.query('TRUNCATE TABLE marketplace_products CASCADE');
        await dataSource.query('TRUNCATE TABLE store_credentials CASCADE');
        await dataSource.query('TRUNCATE TABLE stores CASCADE');
        await dataSource.query('TRUNCATE TABLE parent_products CASCADE');
        await dataSource.query('TRUNCATE TABLE sellers CASCADE');
        await dataSource.query('TRUNCATE TABLE users CASCADE');
        await dataSource.query('TRUNCATE TABLE marketplaces CASCADE');
        await dataSource.query('TRUNCATE TABLE locations CASCADE');
        await dataSource.query('TRUNCATE TABLE business_statuses CASCADE');

        console.log('✅ All data cleared');

        // Step 2: Create Locations
        console.log('📍 Creating locations...');
        const locations = await dataSource.query(`
            INSERT INTO locations (id, code, name, location_type, owner_type, is_virtual, is_active)
            VALUES 
                (gen_random_uuid(), 'SELLER_WH_001', 'Seller Warehouse #1', 'SELLER_WAREHOUSE', 'SELLER', false, true),
                (gen_random_uuid(), 'BM_WH_MAIN', 'BM Main Warehouse', 'BM_WAREHOUSE', 'SYSTEM', false, true),
                (gen_random_uuid(), 'WB_WH_001', 'Wildberries Warehouse', 'MARKETPLACE_WAREHOUSE', 'MARKETPLACE', false, true),
                (gen_random_uuid(), 'OZON_WH_001', 'Ozon Warehouse', 'MARKETPLACE_WAREHOUSE', 'MARKETPLACE', false, true),
                (gen_random_uuid(), 'RETURN_BUFFER', 'Return Buffer Zone', 'RETURN_BUFFER', 'SYSTEM', true, true),
                (gen_random_uuid(), 'DAMAGED', 'Damaged Goods', 'DAMAGED_BUFFER', 'SYSTEM', true, true),
                (gen_random_uuid(), 'SOLD', 'Sold (Virtual)', 'SOLD', 'SYSTEM', true, true),
                (gen_random_uuid(), 'LOST', 'Lost Items', 'LOST', 'SYSTEM', true, true)
            RETURNING id, code, name
        `);
        console.log(`✅ Created ${locations.length} locations`);

        // Step 3: Create Business Statuses
        console.log('📊 Creating business statuses...');
        const statuses = await dataSource.query(`
            INSERT INTO business_statuses (id, code, description, is_final, blocks_operations, requires_issue)
            VALUES 
                (gen_random_uuid(), 'FREE', 'Available for shipment', false, false, false),
                (gen_random_uuid(), 'READY_SHIP', 'Ready for shipment', false, false, false),
                (gen_random_uuid(), 'SENT', 'Sent to marketplace', false, false, false),
                (gen_random_uuid(), 'PAID', 'Payment received', true, false, false),
                (gen_random_uuid(), 'RETURN_REQ', 'Return requested', false, false, false),
                (gen_random_uuid(), 'RETURN_RCV', 'Return received', false, false, false),
                (gen_random_uuid(), 'RETURNED', 'Returned to seller', true, false, false),
                (gen_random_uuid(), 'DAMAGED', 'Damaged', true, true, true),
                (gen_random_uuid(), 'LOST', 'Lost', true, true, true)
            RETURNING id, code
        `);
        console.log(`✅ Created ${statuses.length} business statuses`);

        // Step 4: Create Users
        console.log('👤 Creating users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        const users = await dataSource.query(`
            INSERT INTO users (id, email, password_hash, role, name)
            VALUES 
                (gen_random_uuid(), 'admin@platform.com', $1, 'admin', 'Platform Admin'),
                (gen_random_uuid(), 'admin@bm-agency.com', $2, 'admin', 'Admin User'),
                (gen_random_uuid(), 'staff@bm-agency.com', $2, 'staff', 'Staff Member'),
                (gen_random_uuid(), 'seller1@example.com', $2, 'seller', 'John Seller'),
                (gen_random_uuid(), 'seller2@example.com', $2, 'seller', 'Sarah Merchant'),
                (gen_random_uuid(), 'seller3@example.com', $2, 'seller', 'Mike Trader'),
                (gen_random_uuid(), 'courier@bm-agency.com', $2, 'courier', 'Courier Staff')
            RETURNING id, email, role, name
        `, [adminPassword, hashedPassword]);
        console.log(`✅ Created ${users.length} users`);

        const sellerUsers = users.filter(u => u.role === 'seller');

        // Step 5: Create Sellers
        console.log('🏪 Creating sellers...');
        const sellers = await dataSource.query(`
            INSERT INTO sellers (id, user_id, name, phone_number)
            VALUES 
                (gen_random_uuid(), $1, 'John Seller LLC', '+998901234567'),
                (gen_random_uuid(), $2, 'Sarah Merchant Company', '+998901234568'),
                (gen_random_uuid(), $3, 'Mike Trader Enterprise', '+998901234569')
            RETURNING id, name
        `, [sellerUsers[0].id, sellerUsers[1].id, sellerUsers[2].id]);
        console.log(`✅ Created ${sellers.length} sellers`);

        // Step 6: Create Marketplaces
        console.log('🛒 Creating marketplaces...');
        const marketplaces = await dataSource.query(`
            INSERT INTO marketplaces (id, name)
            VALUES 
                (1, 'Wildberries'),
                (2, 'Ozon'),
                (3, 'Uzum')
            RETURNING id, name
        `);
        console.log(`✅ Created ${marketplaces.length} marketplaces`);

        // Step 7: Create Stores
        console.log('🏬 Creating stores...');
        const stores = await dataSource.query(`
            INSERT INTO stores (id, seller_id, marketplace_id, external_shop_id, name, store_name)
            VALUES 
                (gen_random_uuid(), $1, 1, 'WB12345', 'John WB Store', 'John Seller LLC'),
                (gen_random_uuid(), $1, 2, 'OZON67890', 'John Ozon Store', 'John Seller LLC'),
                (gen_random_uuid(), $2, 1, 'WB54321', 'Sarah WB Store', 'Sarah Merchant Company'),
                (gen_random_uuid(), $2, 3, 'UZUM111', 'Sarah Uzum Store', 'Sarah Merchant Company'),
                (gen_random_uuid(), $3, 2, 'OZON99999', 'Mike Ozon Store', 'Mike Trader Enterprise')
            RETURNING id, store_name, marketplace_id
        `, [sellers[0].id, sellers[1].id, sellers[2].id]);
        console.log(`✅ Created ${stores.length} stores`);

        // Step 8: Create Store Credentials
        console.log('🔑 Creating store credentials...');
        for (const store of stores) {
            await dataSource.query(`
                INSERT INTO store_credentials (id, store_id, token, is_active)
                VALUES (gen_random_uuid(), $1, 'token_' || gen_random_uuid(), true)
            `, [store.id]);
        }
        console.log(`✅ Created ${stores.length} store credentials`);

        // Step 9: Create Parent Products
        console.log('📦 Creating parent products...');
        const products = [];
        const productNames = [
            'Wireless Headphones', 'Smart Watch', 'Phone Case', 'USB Cable', 'Power Bank',
            'Laptop Bag', 'Mouse Pad', 'Keyboard', 'Webcam', 'Monitor Stand',
            'Desk Lamp', 'Phone Holder', 'Cable Organizer', 'Screen Protector', 'Stylus Pen'
        ];

        for (let i = 0; i < 15; i++) {
            const seller = sellers[i % 3];
            const result = await dataSource.query(`
                INSERT INTO parent_products (id, seller_id, product_name, description, cost_usd, cost_uzs)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
                RETURNING id, product_name
            `, [
                seller.id,
                productNames[i],
                `High quality ${productNames[i].toLowerCase()} for daily use`,
                (10 + i * 5).toFixed(2),
                (10 + i * 5) * 12500
            ]);
            products.push(result[0]);
        }
        console.log(`✅ Created ${products.length} parent products`);

        // Step 10: Create Marketplace Products
        console.log('🏷️  Creating marketplace products...');
        const mpProducts = [];
        for (const store of stores) {
            for (let i = 0; i < 3; i++) {
                const result = await dataSource.query(`
                    INSERT INTO marketplace_products (id, store_id, external_product_id, title, raw_payload, last_seen_at)
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
                    RETURNING id, title
                `, [
                    store.id,
                    `EXT_${store.marketplace_id}_${Math.random().toString(36).substr(2, 9)}`,
                    products[i * (stores.indexOf(store) + 1) % products.length].product_name,
                    JSON.stringify({
                        price: 50 + i * 10,
                        stock: 100,
                        sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                    })
                ]);
                mpProducts.push(result[0]);
            }
        }
        console.log(`✅ Created ${mpProducts.length} marketplace products`);

        // Step 11: Create Inventory
        console.log('📊 Creating inventory records...');
        for (const product of products) {
            const sellerIdResult = await dataSource.query(
                'SELECT seller_id FROM parent_products WHERE id = $1', [product.id]
            );
            const seller = sellers.find(s => s.id === sellerIdResult[0].seller_id);

            await dataSource.query(`
                INSERT INTO inventory (id, seller_id, parent_product_id, quantity)
                VALUES (gen_random_uuid(), $1, $2, $3)
            `, [seller.id, product.id, Math.floor(Math.random() * 200) + 50]);
        }
        console.log(`✅ Created ${products.length} inventory records`);

        // Step 12: Create Product States
        console.log('📍 Creating product states...');
        let stateCount = 0;
        for (const product of products.slice(0, 10)) {
            // Create states in different locations with different statuses
            const bm_wh = locations.find(l => l.code === 'BM_WH_MAIN');
            const free_status = statuses.find(s => s.code === 'FREE');

            await dataSource.query(`
                INSERT INTO product_states (id, parent_product_id, location_id, business_status_id, quantity)
                VALUES (gen_random_uuid(), $1, $2, $3, $4)
            `, [product.id, bm_wh.id, free_status.id, Math.floor(Math.random() * 50) + 10]);
            stateCount++;
        }
        console.log(`✅ Created ${stateCount} product states`);

        // Step 13: Create Orders
        console.log('🛍️  Creating orders...');
        const orders = [];
        for (const store of stores) {
            for (let i = 0; i < 5; i++) {
                const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
                const result = await dataSource.query(`
                    INSERT INTO orders (id, store_id, external_order_id, status)
                    VALUES (gen_random_uuid(), $1, $2, $3)
                    RETURNING id, external_order_id
                `, [
                    store.id,
                    `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    statuses[i % statuses.length]
                ]);
                orders.push(result[0]);
            }
        }
        console.log(`✅ Created ${orders.length} orders`);

        // Step 14: Create Order Items
        console.log('📋 Creating order items...');
        let orderItemCount = 0;
        for (const order of orders) {
            const numItems = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numItems; i++) {
                const mpProduct = mpProducts[Math.floor(Math.random() * mpProducts.length)];
                await dataSource.query(`
                    INSERT INTO order_items (id, order_id, marketplace_product_id, quantity, price)
                    VALUES (gen_random_uuid(), $1, $2, $3, $4)
                `, [
                    order.id,
                    mpProduct.id,
                    Math.floor(Math.random() * 3) + 1,
                    (Math.random() * 100 + 20).toFixed(2)
                ]);
                orderItemCount++;
            }
        }
        console.log(`✅ Created ${orderItemCount} order items`);

        // Step 15: Create Product Movements
        console.log('🚚 Creating product movements...');
        const seller_wh = locations.find(l => l.code === 'SELLER_WH_001');
        const bm_wh = locations.find(l => l.code === 'BM_WH_MAIN');
        const wb_wh = locations.find(l => l.code === 'WB_WH_001');
        const free_status = statuses.find(s => s.code === 'FREE');
        const sent_status = statuses.find(s => s.code === 'SENT');

        for (let i = 0; i < 20; i++) {
            const product = products[i % products.length];
            await dataSource.query(`
                INSERT INTO product_movements (
                    id, parent_product_id, from_location_id, to_location_id,
                    from_status_id, to_status_id, quantity, movement_type,
                    initiator_type, comment
                )
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                product.id,
                i % 2 === 0 ? seller_wh.id : bm_wh.id,
                i % 2 === 0 ? bm_wh.id : wb_wh.id,
                free_status.id,
                i % 2 === 0 ? free_status.id : sent_status.id,
                Math.floor(Math.random() * 20) + 5,
                i % 2 === 0 ? 'SELLER_TO_BM' : 'BM_TO_MARKETPLACE',
                'SYSTEM',
                `Automated movement #${i + 1}`
            ]);
        }
        console.log(`✅ Created 20 product movements`);

        // Step 16: Create Product Mappings
        console.log('🔗 Creating product mappings...');
        let mappingCount = 0;
        const adminUser = users.find(u => u.email === 'admin@platform.com');

        for (let i = 0; i < Math.min(mpProducts.length, 10); i++) {
            const mpProduct = mpProducts[i];
            const randomParentProduct = products[i % products.length];

            await dataSource.query(`
                INSERT INTO product_mapping (id, parent_product_id, marketplace_product_id, match_status, matched_by, matched_at)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
            `, [
                randomParentProduct.id,
                mpProduct.id,
                'MATCHED',
                adminUser.id
            ]);
            mappingCount++;
        }
        console.log(`✅ Created ${mappingCount} product mappings`);

        // Step 17: Create Sync Logs
        console.log('📝 Creating sync logs...');
        let syncLogCount = 0;
        for (const seller of sellers.slice(0, 2)) {
            for (const marketplace of marketplaces) {
                const statuses = ['SUCCESS', 'FAILED', 'IN_PROGRESS'];
                const entityTypes = ['PRODUCT', 'ORDER', 'INVENTORY'];

                for (let i = 0; i < 3; i++) {
                    await dataSource.query(`
                        INSERT INTO sync_logs (id, seller_id, marketplace_id, entity_type, status, error_message, payload)
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
                    `, [
                        seller.id,
                        marketplace.id,
                        entityTypes[i],
                        statuses[i],
                        i === 1 ? 'Connection timeout' : null,
                        JSON.stringify({
                            synced_count: i === 0 ? 15 : 0,
                            timestamp: new Date().toISOString()
                        })
                    ]);
                    syncLogCount++;
                }
            }
        }
        console.log(`✅ Created ${syncLogCount} sync logs`);

        // Step 18: Create System Logs
        console.log('📋 Creating system logs...');
        const systemLogTypes = ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'SUCCESS'];
        const systemLogMessages = [
            'User logged in successfully', 'Product created', 'Order synced from marketplace',
            'Inventory updated', 'Store connected successfully', 'Failed to sync products',
            'Payment processed', 'Return initiated', 'Movement approved', 'Database backup completed'
        ];

        for (let i = 0; i < 10; i++) {
            await dataSource.query(`
                INSERT INTO system_logs (id, type, message, metadata)
                VALUES (gen_random_uuid(), $1, $2, $3)
            `, [
                systemLogTypes[i % systemLogTypes.length],
                systemLogMessages[i],
                JSON.stringify({
                    ip_address: `192.168.1.${100 + i}`,
                    user_agent: 'Mozilla/5.0',
                    timestamp: new Date().toISOString()
                })
            ]);
        }
        console.log(`✅ Created 10 system logs`);


        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - ${users.length} users (admin@platform.com: admin123, others: password123)`);
        console.log(`   - ${sellers.length} sellers`);
        console.log(`   - ${marketplaces.length} marketplaces`);
        console.log(`   - ${stores.length} stores`);
        console.log(`   - ${products.length} parent products`);
        console.log(`   - ${mpProducts.length} marketplace products`);
        console.log(`   - ${mappingCount} product mappings`);
        console.log(`   - ${orders.length} orders`);
        console.log(`   - ${orderItemCount} order items`);
        console.log(`   - ${locations.length} locations`);
        console.log(`   - ${statuses.length} business statuses`);
        console.log(`   - ${stateCount} product states`);
        console.log(`   - 20 product movements`);
        console.log(`   - ${syncLogCount} sync logs`);
        console.log(`   - 10 system logs`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await dataSource.destroy();
    }
}

// Run the seed
seed()
    .then(() => {
        console.log('\n✅ Seed script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seed script failed:', error);
        process.exit(1);
    });
