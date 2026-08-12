# StanPC Market Data Seeding Guide

## Overview
This guide walks through the Track A-B integration for seeding photocard market data into Prisma/Supabase.

The workflow is:
1. **Python Script (Track B)** → Collects market data from eBay & Bungle
2. **JSON Export** → `seed_data.json` file
3. **Node.js Seeder (Track A)** → Inserts data via Prisma into PostgreSQL

---

## Prerequisites

### 1. Database Setup (Track A)
Ensure PostgreSQL is running and `DATABASE_URL` is configured:

```bash
cd D:\StanPC\poca-exchange
cat .env | grep DATABASE_URL
```

**Expected output:**
```
DATABASE_URL="postgres://user:password@host:5432/database?..."
```

### 2. Valid DATABASE_URL Options

#### Option A: Supabase (Recommended for Production)
1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy the connection string from Settings → Database → Connection String
3. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres.xxxxx:password@db.xxxxx.supabase.co:5432/postgres"
   ```

#### Option B: Local PostgreSQL (Development)
1. Ensure PostgreSQL is installed and running:
   ```bash
   # Windows
   pg_ctl -D "C:\Program Files\PostgreSQL\data" start
   
   # Or check service status
   Get-Service postgresql-x64-15 | Start-Service
   ```

2. Create a local database:
   ```bash
   psql -U postgres
   CREATE DATABASE stanpc;
   \q
   ```

3. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/stanpc"
   ```

#### Option C: Docker PostgreSQL
```bash
docker run --name stanpc-db -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres:15
```

Update `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
```

---

## Step 1: Apply Prisma Schema to Database

```bash
cd D:\StanPC\poca-exchange

# Verify schema syntax
npx prisma format

# Apply schema to database (creates tables)
npx prisma db push
```

**Expected output:**
```
✔ Your database is now in sync with your Prisma schema
✔ Generated Prisma Client (X.X.X)
```

If you see **P1001 error** (can't reach database):
- ✅ Check that DATABASE_URL is correct in `.env`
- ✅ Verify database server is running
- ✅ Test connection: `psql <DATABASE_URL>`

---

## Step 2: Generate Market Data (Track B → Python)

### Option A: Run Full Market Data Collection
```bash
cd D:\StanPC

# Make sure scrapers are executable
python scripts/seed_market_data.py
```

This will:
1. ✅ Run `ebay_scraper.py` (requires eBay API token)
2. ✅ Run `bungle_crawler.py` (web crawling)
3. ✅ Normalize data to Prisma schema
4. ✅ Export to `scripts/seed_data/seed_data.json`

### Option B: Use Pre-Generated Seed Data
If eBay/Bungle APIs are unavailable, seed data is committed:
```bash
ls -la D:\StanPC\scripts\seed_data\seed_data.json
```

---

## Step 3: Seed Database (Track A → Node.js)

```bash
cd D:\StanPC\poca-exchange

# Run Prisma seeder (uses seed.ts)
npm run db:seed
```

**Expected output:**
```
🌱 Starting directory content seeding...
✅ Seeded 11 groups
✅ Seeded members
✅ Seeded photo cards

💰 Seeding PriceHistory...
✅ Seeded X PriceHistory records

🔗 Seeding GlobalSKUMapping...
✅ Seeded X GlobalSKUMapping records

✨ All seeding completed successfully!
```

---

## What Gets Seeded

### Directory Content (Always)
- **Groups**: TWICE, BLACKPINK, EXO, Stray Kids, SEVENTEEN, etc.
- **Members**: Per group (TZUYU, JENNIE, SEHUN, etc.)
- **PhotoCards**: 12 base cards with estimated prices and badges

### Market Data (From `seed_data.json`)
- **PriceHistory**: Time-series price records from eBay & Bungle
  - Fields: `price`, `currency`, `market`, `sourceUrl`, `createdAt`
  - Linked to PhotoCard via `cardId`

- **GlobalSKUMapping**: Cross-market product links
  - Fields: `market`, `sku`, `skuUrl`, `lastChecked`, `isActive`
  - Enables price comparison across eBay, Mercari, Buyee, Bungle

---

## Verifying Seeded Data

### Query PriceHistory
```bash
npx prisma studio

# Or via SQL
SELECT * FROM price_history LIMIT 10;
```

### Query GlobalSKUMapping
```bash
SELECT * FROM global_sku_mapping LIMIT 10;
```

### Check PhotoCard relationships
```sql
SELECT 
  pc.card_name,
  ph.price,
  ph.market,
  gsm.sku,
  gsm.sku_url
FROM photo_cards pc
LEFT JOIN price_history ph ON pc.id = ph.card_id
LEFT JOIN global_sku_mapping gsm ON pc.id = gsm.card_id
LIMIT 5;
```

---

## Troubleshooting

### Error: "PhotoCard not found for slug: xxx"
- The Python seeder couldn't match scraped listings to existing PhotoCards
- **Solution**: Ensure PhotoCard slugs in `PHOTOCARD_SLUGS` mapping match your database

### Error: "Can't reach database server"
- DATABASE_URL is invalid or server is down
- **Solution**:
  ```bash
  # Test connection
  psql <DATABASE_URL>
  
  # Check PostgreSQL service (Windows)
  Get-Service postgresql-x64-15
  ```

### PriceHistory/SKUMapping records not appearing
- Check that `seed_data.json` exists and contains data
- **Solution**:
  ```bash
  cat scripts/seed_data/seed_data.json | head -20
  ```

### Duplicate SKU Error
- GlobalSKUMapping has unique constraint on `(cardId, market, sku)`
- **Solution**: Re-running seeder will update `lastChecked` for existing SKUs (idempotent)

---

## Next Steps (Track C Integration)

After seeding, Track C (Frontend) will:
1. ✅ Fetch real PriceHistory via `/api/cards?market=ebay`
2. ✅ Display GlobalSKUMapping links on PhotoCard detail page
3. ✅ Show price trends from historical data
4. ✅ Enable multi-market price comparison in gallery view

---

## Development Workflow

For iterative development:

```bash
# Reset database (WARNING: deletes all data)
npx prisma db push --skip-generate --force-reset

# Re-seed
npm run db:seed

# Generate fresh Prisma Client
npx prisma generate
```

---

## Files Modified/Created

### Track A (Backend)
- ✅ `prisma/schema.prisma` — Extended schema with PriceHistory, GlobalSKUMapping
- ✅ `prisma/seed.ts` — Node.js seeder (groups, members, cards, market data)
- ✅ `.env` — DATABASE_URL configuration

### Track B (Data Pipeline)
- ✅ `scripts/seed_market_data.py` — Python seeder (collects + normalizes data)
- ✅ `scripts/seed_data/seed_data.json` — Exported market data (generated by Python)

### Documentation
- ✅ `docs/SEEDING_GUIDE.md` — This file
- ✅ `docs/SESSION_HANDOFF.md` — Project status & milestones

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx prisma format` | Validate schema syntax |
| `npx prisma db push` | Apply schema to database |
| `npx prisma db pull` | Introspect existing database |
| `npm run db:seed` | Run seeder |
| `npx prisma studio` | Open Prisma Studio GUI |
| `python scripts/seed_market_data.py` | Generate market data from scrapers |

---

## Support

For issues or questions:
1. Check error messages above
2. Review `prisma/seed.ts` for seeding logic
3. Check `scripts/seed_market_data.py` for data collection logic
4. Verify DATABASE_URL in `.env`

---

**Last Updated:** 2026-08-11
