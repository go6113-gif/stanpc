# StanPC API Specification

## Overview
Mock API endpoints for MVP Phase 02. All endpoints support graceful degradation with fallback mock data when database is unavailable.

---

## 1. GET /api/photocards

**Description:** Fetch paginated photocards with filtering, sorting, and multi-table joins (PriceHistory, GlobalSKUMapping).

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 12, max: 100) - Items per page
- `sort` (enum: "popular" | "price-asc" | "price-desc" | "newest", default: "popular") - Sort order
- `filter` (string) - Comma-separated filters:
  - `price:MIN-MAX` (e.g., "price:10-50")
  - `country:CODE1|CODE2` (e.g., "country:US|JP")
  - Combined: `filter=price:5-20,country:US|JP`

**Example Requests:**
```bash
# Basic: popular sort, 12 per page
GET /api/photocards?page=1&limit=12

# Sort by price ascending
GET /api/photocards?sort=price-asc&limit=20

# Filter by price range and sort by newest
GET /api/photocards?filter=price:10-50&sort=newest&page=1

# Multiple countries
GET /api/photocards?filter=country:US|JP|KR&limit=12
```

**Response (Success):**
```json
{
  "success": true,
  "source": "database",
  "data": [
    {
      "id": "card-1",
      "slug": "stayc-isa-photobook-ver-001",
      "cardName": "STAYC ISA Photobook",
      "version": "Photobook Ver.",
      "imageUrl": "https://...",
      "thumbImagePath": "/thumbnails/...",
      "estimatedPrice": 15.5,
      "wantCount": 234,
      "haveCount": 89,
      "viewCount": 1203,
      "badge": "Trending",
      "clickCount": 45,
      "priceHistory": [
        {
          "id": "ph-1",
          "price": 14.99,
          "currency": "USD",
          "market": "ebay",
          "sourceUrl": "https://...",
          "createdAt": "2024-08-10T..."
        }
      ],
      "skuMappings": [
        {
          "id": "sku-1",
          "market": "ebay",
          "sku": "123456789",
          "skuUrl": "https://ebay.com/itm/123456789",
          "isActive": true,
          "lastChecked": "2024-08-11T..."
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

**Response (Database Unavailable - Fallback):**
```json
{
  "success": true,
  "source": "mock",
  "warning": "Database unavailable, returning mock data",
  "data": [...],
  "pagination": {...}
}
```

---

## 2. GET /api/price-history

**Description:** Fetch time-series price history for a specific photocard across markets.

**Query Parameters:**
- `cardId` (string, required) - PhotoCard ID
- `days` (number, default: 30) - Days of history to fetch
- `market` (string) - Comma-separated market filter (e.g., "ebay,mercari")

**Example Requests:**
```bash
# Last 30 days of price history for a card
GET /api/price-history?cardId=card-1

# Last 7 days from specific markets
GET /api/price-history?cardId=card-1&days=7&market=ebay,mercari

# Last 90 days
GET /api/price-history?cardId=card-1&days=90
```

**Response:**
```json
{
  "success": true,
  "cardId": "card-1",
  "days": 30,
  "markets": "all",
  "stats": {
    "count": 42,
    "min": 14.5,
    "max": 16.99,
    "avg": 15.42
  },
  "data": [
    {
      "id": "ph-1",
      "price": 14.99,
      "currency": "USD",
      "market": "ebay",
      "sourceUrl": "https://...",
      "createdAt": "2024-08-01T10:30:00Z"
    }
  ]
}
```

---

## 3. GET /api/sku-mapping

**Description:** Fetch multi-market SKU mappings for a photocard (enable cross-platform price comparison and outbound linking).

**Query Parameters:**
- `cardId` (string, required) - PhotoCard ID
- `market` (string) - Comma-separated market filter (e.g., "ebay,mercari")

**Example Requests:**
```bash
# All active SKU mappings for a card
GET /api/sku-mapping?cardId=card-1

# Specific markets
GET /api/sku-mapping?cardId=card-1&market=ebay,mercari
```

**Response:**
```json
{
  "success": true,
  "cardId": "card-1",
  "markets": "all",
  "total": 3,
  "byMarket": {
    "ebay": [
      {
        "id": "sku-1",
        "market": "ebay",
        "sku": "123456789",
        "skuUrl": "https://ebay.com/itm/123456789",
        "isActive": true,
        "lastChecked": "2024-08-11T..."
      }
    ],
    "mercari": [...]
  },
  "data": [...]
}
```

---

## 4. POST /api/sku-mapping

**Description:** Create or update a SKU mapping (used by Track B data pipeline).

**Request Body:**
```json
{
  "cardId": "card-1",
  "market": "ebay",
  "sku": "123456789",
  "skuUrl": "https://ebay.com/itm/123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sku-1",
    "cardId": "card-1",
    "market": "ebay",
    "sku": "123456789",
    "skuUrl": "https://ebay.com/itm/123456789",
    "isActive": true,
    "lastChecked": "2024-08-11T..."
  }
}
```

---

## Error Handling

All endpoints return graceful error responses:

```json
{
  "error": "Missing cardId query parameter",
  "status": 400
}
```

Database unavailability is handled by returning fallback mock data instead of error responses, ensuring UI doesn't break.

---

## Data Flow Integration (Phase 02)

```
Track B (Python Crawler)
  ↓
Extract: [group, member, album, card_data]
  ↓
POST /api/sku-mapping (Register in GlobalSKUMapping)
  ↓
Store to DB: PhotoCard + PriceHistory
  ↓
Track C (Frontend)
  ↓
GET /api/photocards (Fetch with filters/sort)
  ↓
GET /api/price-history?cardId=X (Render price trend)
  ↓
GET /api/sku-mapping?cardId=X (Outbound links)
  ↓
/gallery renders real data
```
