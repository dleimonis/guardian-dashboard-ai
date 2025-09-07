# Database & Cache Setup Guide

## 🚀 Quick Start

### 1. Copy Environment Variables
```bash
cp .env.example .env
# Edit .env with your specific values
```

### 2. Start Database and Redis
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# With development tools (pgAdmin, Redis Commander)
docker-compose --profile dev up -d
```

### 3. Verify Services
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### 4. Test Database Connection
```bash
cd backend
npm run dev
# The app will automatically create tables on first run
```

## 📦 What's Included

### Core Services
- **PostgreSQL 15** with PostGIS extension for geospatial data
- **Redis 7** for caching and queue management

### Development Tools (optional)
- **pgAdmin** - PostgreSQL web UI (http://localhost:8082)
  - Email: admin@guardian.ai
  - Password: admin
- **Redis Commander** - Redis web UI (http://localhost:8081)
- **Bull Board** - Queue monitoring (http://localhost:8083)

## 🗄️ Database Schema

The database includes the following tables:
- `users` - User accounts synced with Descope
- `disasters` - All detected disasters
- `alerts` - Generated alerts from disasters
- `alert_zones` - User-defined geographic monitoring areas
- `agent_logs` - AI agent activity logs
- `notification_history` - All sent notifications
- `api_keys` - Encrypted external service credentials
- `system_statistics` - System metrics

## 🔧 TypeORM Entities

All database tables have corresponding TypeORM entities in `backend/src/entities/`:
- `User.ts` - User entity with relations
- `Disaster.ts` - Disaster events with geospatial data
- `Alert.ts` - Alert records
- `AlertZone.ts` - Geographic monitoring zones
- `AgentLog.ts` - Agent activity logging
- `NotificationHistory.ts` - Notification tracking
- `ApiKey.ts` - API key storage
- `SystemStatistics.ts` - Metrics storage

## 🔑 Environment Variables

### Database Configuration
```env
DATABASE_URL=postgresql://guardian:guardian_pass@localhost:5432/guardian_db
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=guardian_db
DATABASE_USER=guardian
DATABASE_PASSWORD=guardian_pass
```

### Redis Configuration
```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_QUEUE_DB=1
```

## 📊 Queue Management

The application uses Bull queues for:
- **Notification Queue** - SMS, email, webhook delivery
- **Disaster Queue** - Processing disaster events
- **Agent Task Queue** - Async agent operations

Access Bull Board at http://localhost:8083 to monitor queues.

## 🛠️ Maintenance Commands

### Database Operations
```bash
# Access PostgreSQL CLI
docker exec -it guardian_postgres psql -U guardian -d guardian_db

# Backup database
docker exec guardian_postgres pg_dump -U guardian guardian_db > backup.sql

# Restore database
docker exec -i guardian_postgres psql -U guardian guardian_db < backup.sql
```

### Redis Operations
```bash
# Access Redis CLI
docker exec -it guardian_redis redis-cli

# Clear cache
docker exec guardian_redis redis-cli FLUSHDB

# Monitor Redis commands
docker exec guardian_redis redis-cli MONITOR
```

### Docker Operations
```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart a service
docker-compose restart postgres
```

## 🔍 Testing Connections

### Test PostgreSQL
```sql
-- Connect and test PostGIS
SELECT version();
SELECT PostGIS_Version();

-- Check tables
\dt

-- Test geospatial query
SELECT * FROM disasters 
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(-122.4194, 37.7749)::geography,
  10000
);
```

### Test Redis
```bash
# In Redis CLI
PING
# Should return: PONG

SET test "Hello"
GET test
# Should return: "Hello"
```

## 🚨 Troubleshooting

### PostgreSQL Connection Issues
1. Check if container is running: `docker-compose ps`
2. Check logs: `docker-compose logs postgres`
3. Verify credentials in `.env` match `docker-compose.yml`
4. Try connecting directly: `psql -h localhost -U guardian -d guardian_db`

### Redis Connection Issues
1. Check if container is running: `docker-compose ps`
2. Check logs: `docker-compose logs redis`
3. Test connection: `redis-cli -h localhost ping`

### TypeORM Issues
1. Check `backend/src/config/database.ts` configuration
2. Verify entities are imported correctly
3. Check TypeORM logs by setting `logging: true` in config
4. Ensure `reflect-metadata` is imported at app startup

## 📚 Next Steps

1. **Start Docker services**: `docker-compose up -d`
2. **Run the application**: `cd backend && npm run dev`
3. **Implement external APIs**: See `backend/src/services/` for NASA, USGS, NOAA integration
4. **Set up notifications**: Configure Twilio and SendGrid in `.env`
5. **Run tests**: `cd backend && npm test`

## 🔗 Useful Resources

- [TypeORM Documentation](https://typeorm.io)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Redis Documentation](https://redis.io/documentation)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Note**: The database will auto-create tables on first run if `NODE_ENV=development`. In production, run migrations manually.