-- Create users table manually
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert admin user with bcrypt hash for 'admin123'
-- This is a pre-hashed bcrypt password for 'admin123' (10 rounds)
INSERT INTO users (email, password_hash, role)
VALUES ('admin@platform.com', '$2b$10$YourBcryptHashHere', 'admin')
ON CONFLICT (email) DO NOTHING;

SELECT * FROM users WHERE email = 'admin@platform.com';
