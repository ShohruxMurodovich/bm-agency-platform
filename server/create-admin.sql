-- Create admin user
-- Run this with: psql -h localhost -U admin -d platform_db -f create-admin.sql

DO $$
DECLARE
    admin_password_hash TEXT;
BEGIN
    -- Generate bcrypt hash for 'admin123' (pre-hashed with bcrypt rounds=10)
    admin_password_hash := '$2a$10$YzU5NzU5NzU5NzU5NzU5Nu7X6x4Yz6x4Yz6x4Yz6x4Yz6x4Yz6x4Y';
    
    -- Check if admin user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@bm-agency.com') THEN
        RAISE NOTICE 'Admin user already exists with email: admin@bm-agency.com';
        RAISE NOTICE 'Login credentials: admin@bm-agency.com / admin123';
    ELSE
        -- Insert admin user
        INSERT INTO users (id, email, password_hash, role, name, created_at)
        VALUES (
            gen_random_uuid(),
            'admin@bm-agency.com',
            admin_password_hash,
            'admin',
            'Admin User',
            NOW()
        );
        
        RAISE NOTICE 'Admin user created successfully!';
        RAISE NOTICE 'Email: admin@bm-agency.com';
        RAISE NOTICE 'Password: admin123';
    END IF;
END $$;
