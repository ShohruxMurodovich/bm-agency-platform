import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'platform_db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
});

async function seedMarketplaces() {
    await dataSource.initialize();
    const queryRunner = dataSource.createQueryRunner();

    try {
        // Ensure all marketplaces exist
        await queryRunner.query(`
            INSERT INTO marketplaces (id, name) VALUES
            (1, 'Wildberries'),
            (2, 'Ozon'),
            (3, 'Yandex Market'),
            (4, 'AliExpress'),
            (5, 'Uzum Market'),
            (6, 'Alif Shop')
            ON CONFLICT (id) DO NOTHING
        `);
        console.log('✓ Marketplaces synced');

        // Display all tables
        const tables = await queryRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        console.log('\n📊 Database Tables:');
        tables.forEach((table: any) => {
            console.log(`  - ${table.table_name}`);
        });

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await queryRunner.release();
        await dataSource.destroy();
    }
}

seedMarketplaces();
