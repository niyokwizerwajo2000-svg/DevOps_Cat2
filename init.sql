-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus VARCHAR(100) NOT NULL,
  seat INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO tickets (bus, seat, price) VALUES
  ('RITCO', 12, 5000),
  ('Volcano', 7, 4500),
  ('KBS', 15, 4800),
  ('Easy Coach', 22, 5200),
  ('Nairobi Express', 8, 4700);

-- Create users table (optional)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (name, email, phone) VALUES
  ('John Doe', 'john@example.com', '+254712345678'),
  ('Jane Smith', 'jane@example.com', '+254798765432'),
  ('Mike Johnson', 'mike@example.com', '+254723456789');
