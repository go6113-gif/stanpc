# StanPC Database Seeding Guide

## Overview

This guide explains how to set up and seed the StanPC database with real market data from Track B (Python scrapers) and directory content (Groups, Members, PhotoCards).

---

## 1. DATABASE_URL Configuration

### Option A: Local PostgreSQL with Docker (Recommended for Development)

**Prerequisites:** Docker and Docker Compose installed

**Steps:**

1. Start the PostgreSQL container from the project root:
```bash
docker-compose up -d
```

2. The database will be available at:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Username:** `stanpc`
   - **Password:** `stanpc_dev_password`
   - **Database:** `stanpc_db`

3. Verify the connection:
```bash
docker-compose ps
docker logs stanpc_postgres
```

4. Access pgAdmin (optional):
   - URL: `http://localhost:5050`
   - Email: `admin@stanpc.local`
   - Password: `admin`

5. The `.env` file is already configured for this setup:
```
DATABASE_URL="postgresql://stanpc:stanpc_dev_password@localhost:5432/stanpc_db"
```

**Stop the containers:**
```bash
docker-compose down
```

---

### Option B: Supabase Cloud

1. Create a project at https://supabase.com
2. Copy the PostgreSQL connection string from Project Settings
3. Update `.env`:
```
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require"
```

---

### Option C: Local PostgreSQL (Manual Installation)

1. Install PostgreSQL 14+ from https://www.postgresql.org/download/
2. Create a new database:
```sql
CREATE DATABASE stanpc_db OWNER postgres;
```

3. Update `.env`:
```
DATABASE_URL="postgresql://postgres:[password]@localhost:5432/stanpc_db"
```

---

## 2. Prisma Schema Synchronization

**Sync your schema to the database:**

```bash
cd poca-exchange
npx prisma db push --accept-data-loss
```

**Output should show:**
```
✓ Sync successful

The following migration(s) have been created and applied to your database:
- Migration: create_tables_v1
```

**Verify schema was applied:**
```bash
npx prisma studio
```

This opens an interactive database browser at `http://localhost:5555`

---

## 3. Generate Seed Data (Track B Output)

**Run the Python scraper to generate seed data:**

```bash
cd ../scripts
python seed_market_data.py
```

**This creates:**
- `scripts/seed_data/seed_data.json` — eBay + Bungle price history & SKU mappings

If you skip this, the seeder uses mock data in `seed_data.json` (already provided).

---

## 4. Execute Database Seeding

**Run the Node.js seeder:**

```bash
cd ../poca-exchange
npm run db:seed
```

**What it does:**

1. **Seed Directory Content (Groups, Members, PhotoCards)**
   - Creates K-pop groups: TWICE, BLACKPINK, EXO, Stray Kids, etc.
   - Creates members for each group
   - Creates 12 sample photocard entries

2. **Seed Market Data (PriceHistory, GlobalSKUMapping)**
   - Reads `scripts/seed_data/seed_data.json`
   - For each record:
     - Finds the photocard by slug
     - Inserts PriceHistory entries (price snapshots from eBay, Mercari, Buyee)
     - Inserts/updates GlobalSKUMapping (product IDs and links)

**Expected output:**
```
============================================================
STANPC DATABASE SEEDING
============================================================

🌱 Starting directory content seeding...
✅ Seeded 11 groups
✅ Seeded members
✅ Seeded photo cards

🌱 Starting market data seeding...
📊 Seed data loaded:
  - PriceHistory records: 10
  - GlobalSKUMapping records: 10

💰 Seeding PriceHistory...
  ✅ Seeded 10 PriceHistory records

🔗 Seeding GlobalSKUMapping...
  ✅ Seeded 10 GlobalSKUMapping records

✨ All seeding completed successfully!
============================================================
```

---

## 5. Verify Seeded Data

**Use Prisma Studio:**

```bash
npx prisma studio
```

Then browse:
- `groups` — 11 K-pop groups
- `photo_cards` — 12 sample cards
- `price_history` — 10 price snapshots
- `global_sku_mapping` — 10 market SKU links

**Or query via API:**

```bash
# Get all photocards with price history
curl "http://localhost:3000/api/photocards?limit=5"

# Get price history for a card
curl "http://localhost:3000/api/price-history?cardId=[id]"

# Get SKU mappings
curl "http://localhost:3000/api/sku-mapping?cardId=[id]"
```

---

## 6. Seeding Workflow (Track A-B-C Integration)

```
Track B (Python)
├─ ebay_scraper.py + bungle_crawler.py
├─ image_pipeline.py (WebP + thumbnails)
└─ seed_market_data.py
   └─> scripts/seed_data/seed_data.json

Track A (Node.js)
├─ npx prisma db push (schema sync)
└─ npm run db:seed (data loading)
   ├─ Directory: Groups/Members/PhotoCards
   └─ Market Data: PriceHistory + SKU mappings
   └─> PostgreSQL

Track C (Frontend)
├─ GET /api/photocards (list view)
├─ GET /api/price-history (trend chart)
└─ GET /api/sku-mapping (outbound links)
   └─> /gallery & /photocard/[id]
```

---

## 7. Re-seeding (Clear & Repopulate)

**⚠️ WARNING: This deletes all data!**

```bash
# Reset the database (removes all tables)
npx prisma migrate reset

# Then seed again
npm run db:seed
```

---

## 8. Troubleshooting

### "Can't reach database server"
- Ensure Docker is running: `docker-compose up -d`
- Check connection: `docker logs stanpc_postgres`
- Verify DATABASE_URL in `.env`

### "PhotoCard not found for slug: ..."
- The seeder first creates directory content, then tries to match seed data
- Ensure `scripts/seed_data/seed_data.json` uses the same slug format as seed.ts
- Example: `"twice-tzuyu-Feel-Special"` (lowercase group, member, album slugs)

### "Prisma schema is out of sync"
- Run: `npx prisma db push --accept-data-loss`
- Or reset and reseed: `npx prisma migrate reset`

---

## 9. Monitoring Seed Progress

**Check seed.ts console output:**

```bash
npm run db:seed 2>&1 | tee seed-output.log
```

**Query database during seeding:**

```bash
npx prisma studio
# Refresh every 5 seconds to see records being inserted
```

**Verify final counts:**

```bash
# In Prisma Studio, each model shows record count:
- groups: 11
- members: 12
- photo_cards: 12
- price_history: 10 (or more if Track B adds more)
- global_sku_mapping: 10 (or more)
```

---

## 10. Next Steps

After seeding completes:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test endpoints:**
   - `/api/photocards?page=1&limit=12`
   - `/api/price-history?cardId=[id]`
   - `/api/sku-mapping?cardId=[id]`

3. **View in UI:**
   - http://localhost:3000/gallery
   - http://localhost:3000/card/[slug]

4. **Integrate with Track C:**
   - Replace mock JSON with API calls
   - Add React Query/SWR for data fetching
   - Display real price history & SKU links

---

## Reference

- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Docker Compose:** https://docs.docker.com/compose
- **Supabase:** https://supabase.com/docs
