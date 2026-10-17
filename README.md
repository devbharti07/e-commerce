# Jagdamba Mobile — Wholesale Smartphone E-Commerce Platform

A production-grade B2B wholesale smartphone e-commerce platform built for mobile retailers, resellers, and regional dealers. Features live warehouse inventory, volume tier pricing, order request negotiation, dealer confirmation chat, and an owner administration dashboard.

---

## 1. Prerequisites

Before running the application locally, ensure you have installed:

- **Node.js**: v20+ or v24 LTS (`node -v`)
- **npm**: v10+ (`npm -v`)
- **Docker Desktop**: With WSL 2 Linux backend on Windows (`docker --version`, `docker compose version`)

---

## 2. Environment Configuration

1. Copy the example environment template:
   ```bash
   cp .env.example .env
   ```

2. Review `.env` and verify your local settings:
   ```env
   DATABASE_URL="postgresql://jagdamba_user:jagdamba_secret_pass_2026@localhost:5432/jagdamba_mobile?schema=public"
   POSTGRES_USER="jagdamba_user"
   POSTGRES_PASSWORD="jagdamba_secret_pass_2026"
   POSTGRES_DB="jagdamba_mobile"
   POSTGRES_PORT=5432

   JWT_SECRET="jagdamba_wholesale_super_secret_jwt_key_2026_secured"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

> **Security Note:** The `.env` file contains sensitive credentials and is strictly excluded by `.gitignore`. Never commit `.env` or production secrets to source control.

---

## 3. Database Management with Docker

The PostgreSQL database runs in Docker via `docker-compose.yml`, configured with:
- **Image:** Official `postgres:16-alpine`
- **Container Name:** `jagdamba_postgres`
- **Network Isolation:** Exposed strictly on `127.0.0.1:5432` (localhost only)
- **Named Volume:** `jagdamba_postgres_data` for persistent storage
- **Healthcheck:** Automated `pg_isready` probe

### Starting the Database
```bash
docker compose up -d db
```

### Checking Container Health and Status
```bash
docker compose ps
```
A healthy container will display `STATUS: Up ... (healthy)` on port `127.0.0.1:5432->5432/tcp`.

### Viewing Database Logs
```bash
docker compose logs -f db
# Or view the last 100 lines:
docker compose logs --tail=100 db
```

### Stopping the Database Safely
To stop the database without losing any data:
```bash
# Option A: Pause the container
docker compose stop db

# Option B: Stop and remove containers and networks while preserving storage volume
docker compose down
```

### ⚠️ Critical Warning on Volume Persistence
> **DO NOT RUN `docker compose down -v`** as a routine cleanup command.
> The `-v` flag deletes all Docker volumes, permanently erasing all stored products, customer accounts, orders, and audit history. Only use `docker compose down` (without `-v`) to preserve the `jagdamba_postgres_data` volume.

---

## 4. Database Migrations & Seeding

### Applying Versioned Prisma Migrations
When setting up a new environment or applying schema changes:
```bash
# In local development:
npx prisma migrate dev

# In CI/CD or production environments:
npx prisma migrate deploy
```

### Generating the Prisma Client
```bash
npx prisma generate
```

### Seeding Development Data Safely (Idempotent)
The database seed script is **100% idempotent**. Running it populates initial brands, flagship models, variants, specifications, tier pricing, and default accounts, and safely skips or updates existing records without creating duplicates:
```bash
npx tsx prisma/seed.ts
```

### Default Seed Accounts
- **Owner / Administrator**:
  - **Email:** `owner@jagdambamobile.com`
  - **Password:** `Owner@Jagdamba2026`
  - **Role:** `OWNER`
- **Retailer / Dealer**:
  - **Email:** `rajesh.mobile@gmail.com`
  - **Password:** `Retailer@2026`
  - **Role:** `CUSTOMER`

---

## 5. Running the Application & Tests

### Automated Unit & Integration Tests
Execute the regression test suite covering volume tier pricing, inventory safety policies, and PostgreSQL database queries:
```bash
npx tsx --test tests/pricing-inventory.test.ts tests/postgres-workflow.test.ts
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

### Verifying System Health
Check database connectivity and live inventory counts via the health endpoint:
```bash
curl http://localhost:3000/api/health
```
Expected response:
```json
{
  "status": "HEALTHY",
  "service": "Jagdamba Mobile Distribution API",
  "database": "CONNECTED",
  "engine": "PostgreSQL",
  "catalog": { "products": 3, "variants": 5 }
}
```

### Production Build
```bash
npm run build
```

---

## 6. Backup and Disaster Recovery

### Creating a Database Backup
To take a compressed SQL backup from the running container:
```bash
docker exec -t jagdamba_postgres pg_dump -U jagdamba_user -d jagdamba_mobile > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring from a Backup
To restore data into a clean database instance:
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i jagdamba_postgres psql -U jagdamba_user -d jagdamba_mobile
```

---

## 7. Connecting to Managed Cloud PostgreSQL in Production

When deploying to production platforms (such as AWS RDS, Google Cloud SQL, Supabase, Neon, or Railway):

1. **Provision a PostgreSQL 15+ Instance** with SSL mode enabled.
2. **Set the Production Connection String** in your cloud deployment environment variables:
   ```env
   DATABASE_URL="postgresql://<CLOUD_USER>:<CLOUD_PASSWORD>@<CLOUD_HOST>:<PORT>/<DATABASE_NAME>?sslmode=require&schema=public"
   ```
3. **Execute Migrations During Deployment Pipeline**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Connection Pooling**: For serverless deployments (e.g. Vercel), use Prisma Accelerate or a connection pooler like PgBouncer (`?pgbouncer=true`).
