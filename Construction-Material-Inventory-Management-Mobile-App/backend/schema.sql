-- Run this file once to set up the database schema.
-- In terminal: psql -U postgres -d construction_inventory -f schema.sql

-- users
CREATE TABLE IF NOT EXISTS credentials(
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    hashed_password VARCHAR(64) NOT NULL,
    permission_level INTEGER NOT NULL CHECK (permission_level BETWEEN 1 AND 4)
);

-- jobsites
CREATE TABLE IF NOT EXISTS jobsites(
    id SERIAL PRIMARY KEY,
    jobsite_name VARCHAR(128) NOT NULL,
    jobsite_address VARCHAR(256) NOT NULL
);

-- warehouses
CREATE TABLE IF NOT EXISTS warehouses(
    id SERIAL PRIMARY KEY,
    warehouse_address VARCHAR(256) UNIQUE NOT NULL
);

-- payorders
CREATE TABLE IF NOT EXISTS payorders(
    id SERIAL PRIMARY KEY,
    jobsite_id INTEGER NOT NULL REFERENCES jobsites(id) ON DELETE CASCADE,
    payorder_number VARCHAR(16) NOT NULL,
    uploaded_by VARCHAR(254) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fulfillment_status VARCHAR(16) NOT NULL DEFAULT 'pending'
        CHECK (fulfillment_status IN ('pending', 'partial', 'fulfilled'))
);

-- deliveries
CREATE TABLE IF NOT EXISTS deliveries(
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    packing_slip_id VARCHAR(64) NOT NULL,
    destination_address VARCHAR(256) NOT NULL,
    arrived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- materials
-- can belong to a jobsite, payorder, or delivery (however only one at a time)
CREATE TABLE IF NOT EXISTS materials(
    id SERIAL PRIMARY KEY,
    jobsite_id INTEGER REFERENCES jobsites(id) ON DELETE CASCADE,
    payorder_id INTEGER REFERENCES payorders(id) ON DELETE CASCADE,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
    material_name VARCHAR(128) NOT NULL,
    material_description TEXT NOT NULL,
    material_amount INTEGER NOT NULL CHECK (material_amount >= 0),
    fulfilled_amount INTEGER NOT NULL DEFAULT 0 CHECK (fulfilled_amount >= 0)
);

-- equipment
CREATE TABLE IF NOT EXISTS equipment(
    id SERIAL PRIMARY KEY,
    jobsite_id INTEGER REFERENCES jobsites(id) ON DELETE CASCADE,
    payorder_id INTEGER REFERENCES payorders(id) ON DELETE CASCADE,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
    equipment_name VARCHAR(128) NOT NULL,
    equipment_serial_number VARCHAR(64) NOT NULL,
    equipment_description TEXT NOT NULL,
    equipment_amount INTEGER NOT NULL CHECK (equipment_amount >= 0),
    fulfilled_amount INTEGER NOT NULL DEFAULT 0 CHECK (fulfilled_amount >= 0)
);

-- tools
CREATE TABLE IF NOT EXISTS tools(
    id SERIAL PRIMARY KEY,
    jobsite_id INTEGER REFERENCES jobsites(id) ON DELETE CASCADE,
    payorder_id INTEGER REFERENCES payorders(id) ON DELETE CASCADE,
    delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
    tool_name VARCHAR(128) NOT NULL,
    tool_id_number VARCHAR(64) NOT NULL,
    tool_amount INTEGER NOT NULL DEFAULT 1 CHECK (tool_amount >= 0),
    fulfilled_amount INTEGER NOT NULL DEFAULT 0 CHECK (fulfilled_amount >= 0)
);

-- default admin account
-- password: Admin1234  (bcrypt hash, change in production)
INSERT INTO credentials (email, hashed_password, permission_level)
VALUES ('admin@coolsys.com',
        '$2a$12$DxpbB.DUsj/2YtdobLtIO.FESS8N8XTeGFaJHaH2Cd0YQNFcuWHSq',
        1
) ON CONFLICT DO NOTHING;