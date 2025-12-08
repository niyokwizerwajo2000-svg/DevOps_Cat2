# Ticket Booking Backend API

A Node.js Express REST API for booking and managing bus tickets with MySQL database and Docker support.

## Features

- RESTful API for ticket management (CRUD operations)
- MySQL database with persistent storage
- Docker & Docker Compose setup for easy deployment
- Environment configuration support
- Sample data initialization on startup

## Project Structure

```
.
├── index.js                 # Main Express application
├── Dockerfile              # Docker image configuration
├── docker-compose.yml      # Multi-container setup (app + MySQL)
├── init.sql                # Database initialization script
├── package.json            # Node.js dependencies
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── .dockerignore           # Docker ignore rules
└── .vscode/settings.json   # VS Code settings
```

## Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized setup)
- MySQL 8.0+ (included in Docker)

## Installation

### Option 1: Docker (Recommended)

```bash
# Build and start containers
docker-compose up

# The API will be available at http://localhost:3000
# MySQL will be available at localhost:3306
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start the server
npm start

# For development with auto-reload
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=3000
DB_HOST=mysql
DB_USER=ticketuser
DB_PASSWORD=ticketpass123
DB_NAME=ticket_db
```

## API Endpoints

### Get Home
```
GET /
```
Returns a welcome message.

### Get All Tickets
```
GET /tickets
```
Returns all available tickets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bus": "RITCO",
      "seat": 12,
      "price": 5000,
      "created_at": "2025-12-08T00:00:00.000Z"
    }
  ]
}
```

### Book a Ticket
```
POST /tickets
```

**Request Body:**
```json
{
  "bus": "KBS",
  "seat": 15,
  "price": 4800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "bus": "KBS",
    "seat": 15,
    "price": 4800,
    "created_at": "2025-12-08T11:30:00.000Z"
  }
}
```

### Get Single Ticket
```
GET /tickets/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bus": "RITCO",
    "seat": 12,
    "price": 5000,
    "created_at": "2025-12-08T00:00:00.000Z"
  }
}
```

### Delete a Ticket
```
DELETE /tickets/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted"
}
```

## Database Schema

### Tickets Table
```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus VARCHAR(100) NOT NULL,
  seat INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Docker Commands

```bash
# Start containers in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Remove volumes (clears database)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

## Development

```bash
# Install dependencies
npm install

# Run syntax check
node -c index.js

# List installed packages
npm ls --depth=0
```

## Testing the API

Using curl:

```bash
# Get all tickets
curl http://localhost:3000/tickets

# Book a ticket
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"bus":"KBS","seat":15,"price":4800}'

# Get single ticket
curl http://localhost:3000/tickets/1

# Delete ticket
curl -X DELETE http://localhost:3000/tickets/1
```

## Dependencies

- **express** - Web framework
- **mysql2** - MySQL database driver
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload (dev)

## License

MIT

## Author

DevOps CAT

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.
# ticket-booking-backend
