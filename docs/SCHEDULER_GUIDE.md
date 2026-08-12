# StanPC Data Pipeline Scheduler Guide

## Overview

The scheduler (`scripts/scheduler.py`) automates the complete data collection → processing → DB ingestion pipeline on a configurable interval (default: 6 hours). It implements **Graceful Degradation**, ensuring the pipeline continues even if individual steps fail.

---

## Features

### 🔄 Automated Pipeline Phases

1. **Phase 1: Data Collection**
   - eBay API scraping (up to 10 listings per keyword)
   - Bungle website crawling (up to 2 pages per keyword)
   - Automatic retry logic for transient failures

2. **Phase 2: Image Processing** (Optional)
   - Multi-card detection and cropping
   - 1:1.54 aspect ratio normalization
   - WebP compression (30-50KB per card)
   - Thumbnail generation (100x154px)

3. **Phase 3: Price Analysis**
   - Min/max/average price calculation
   - Market comparison (eBay vs Bungle)
   - Trend detection (up/down/stable)

4. **Phase 4: Seed Data Export**
   - Save `seed_data.json` with PriceHistory + GlobalSKUMapping
   - Ready for Prisma database seeding

5. **Phase 5: Database Seeding** (Optional)
   - Runs `npm run db:seed` to load data into PostgreSQL
   - Gracefully skipped if Node.js is not available

### 🛡️ Graceful Degradation

- Each pipeline phase has independent error handling
- Failures in one phase do not block subsequent phases
- Partial successes are logged and continued
- All events logged to `logs/pipeline.log` in structured JSON format

### 📊 Structured Logging

All pipeline events are logged as JSON to `logs/pipeline.log`:

```json
{
  "timestamp": "2025-08-11T12:34:56.789123",
  "level": "INFO",
  "logger": "scheduler",
  "message": "Starting eBay data collection...",
  "module": "scheduler",
  "pipeline_step": "collect_ebay_data",
  "status": "success",
  "duration_seconds": 45.2,
  "records_count": 15
}
```

Run records are also saved to `logs/runs/{run_id}_record.json` with complete execution details.

---

## Installation

### 1. Install Dependencies

```bash
cd D:\StanPC
pip install -r scripts/requirements.txt
```

Key new dependency:
- `apscheduler>=3.10.0` - Background job scheduling

### 2. Verify Python Environment

```bash
python --version  # Should be 3.8+
python -c "import apscheduler; print('APScheduler installed')"
```

---

## Usage

### Mode 1: Run Once (Testing)

Run the pipeline a single time without scheduling:

```bash
cd D:\StanPC
python scripts/scheduler.py --once
```

**Output:**
- Console: Human-readable progress messages
- `logs/pipeline.log`: Structured JSON logs
- `logs/runs/{timestamp}_record.json`: Execution details

### Mode 2: Run as Daemon (Production)

Start the scheduler to run every 6 hours in the background:

```bash
cd D:\StanPC
python scripts/scheduler.py --daemon
```

**Features:**
- Runs immediately on startup
- Repeats every 6 hours automatically
- Press `Ctrl+C` to stop
- All output goes to console + `logs/pipeline.log`

### Mode 3: Default (One-time)

```bash
cd D:\StanPC
python scripts/scheduler.py
```

Same as `--once` if no mode specified.

---

## Output Files

### Logs
- `logs/pipeline.log` - All pipeline events (JSON lines)
- `logs/runs/{run_id}_record.json` - Complete run execution record

### Seed Data
- `scripts/seed_data/seed_data.json` - Collected and normalized data
  - `priceHistory`: Time-series price records (eBay + Bungle)
  - `globalSKUMapping`: Multi-market SKU mappings

### Images (Optional)
- `scripts/output/` - Processed WebP cards + thumbnails
- `scripts/output/processing_report.json` - Image processing metadata

### Analysis (Optional)
- `scripts/output/price_analysis_report.json` - Price statistics by card

---

## Configuration

### Adjust Interval

Edit `scripts/scheduler.py` to change the default 6-hour interval:

```python
class PipelineScheduler:
    INTERVAL_HOURS = 6  # ← Change this value
```

### Adjust Search Keywords

Edit search keywords in `StanPCDataPipeline`:

```python
SEARCH_KEYWORDS = [
    "TWICE TZUYU 포토카드",
    "BLACKPINK JENNIE 포토카드",
    # ... add or modify
]
```

---

## Monitoring & Logs

### Check Recent Logs

```bash
# Print last 20 lines
tail -n 20 logs/pipeline.log

# Watch live logs (if using --daemon)
tail -f logs/pipeline.log
```

### Parse JSON Logs

```bash
# Pretty-print JSON logs (Linux/Mac)
cat logs/pipeline.log | jq '.'

# Filter by status
cat logs/pipeline.log | jq 'select(.status=="failed")'

# Filter by step
cat logs/pipeline.log | jq 'select(.pipeline_step=="collect_ebay_data")'
```

### Check Run Records

```bash
# List all run records
ls -lah logs/runs/

# View specific run
cat logs/runs/20250811_123456_record.json | jq '.'
```

---

## Example Run Output

### Console Output
```
[INFO] Starting StanPC Data Pipeline Scheduler...
[INFO] Log file: D:\StanPC\logs\pipeline.log

[INFO] Running in daemon mode (press Ctrl+C to stop)...
[INFO] Scheduler started successfully

[INFO] ======================================================================
[INFO] 🚀 Starting StanPC Data Pipeline Run: 20250811_123456
[INFO] ======================================================================

[INFO] 📊 Phase 1: Data Collection
[INFO] Starting eBay data collection...
[INFO] ✓ eBay collection completed: 15 price records

[INFO] Starting Bungle data collection...
[INFO] ✓ Bungle collection completed: 28 total price records

[INFO] 🖼️  Phase 2: Image Processing
[INFO] Sample images directory not found (skipped)

[INFO] 📈 Phase 3: Price Analysis
[INFO] Starting price analysis...
[INFO] ✓ Price analysis completed: 8 cards analyzed

[INFO] 💾 Phase 4: Save Seed Data
[INFO] Saving seed data to JSON...
[INFO] ✓ Seed data saved: 43 total records

[INFO] 🗄️  Phase 5: Database Seeding
[INFO] Starting database seeding with npm run db:seed...
[INFO] ✓ Database seeding completed successfully

[INFO] ======================================================================
[INFO] ✅ Pipeline Run Complete: SUCCESS
[INFO]    Duration: 125.3s
[INFO]    Successful: 5 | Partial: 0 | Skipped: 0
[INFO] ======================================================================
```

### JSON Log Sample
```json
{
  "timestamp": "2025-08-11T12:34:56.123456",
  "level": "INFO",
  "logger": "scheduler",
  "message": "Pipeline Step: collect_ebay_data - success",
  "pipeline_step": "collect_ebay_data",
  "status": "success",
  "duration_seconds": 45.2,
  "records_count": 15
}
```

### Run Record Sample
```json
{
  "run_id": "20250811_123456",
  "start_time": "2025-08-11T12:34:56.123456",
  "end_time": "2025-08-11T12:37:01.456789",
  "duration_seconds": 125.3,
  "overall_status": "success",
  "steps": [
    {
      "name": "collect_ebay_data",
      "start_time": "2025-08-11T12:34:56.123456",
      "end_time": "2025-08-11T12:35:42.125000",
      "duration_seconds": 46.0,
      "status": "success",
      "records_count": 15,
      "error": null
    },
    ...
  ],
  "summary": {
    "total_steps": 5,
    "successful_steps": 5,
    "partial_steps": 0,
    "skipped_steps": 0,
    "failed_steps": 0,
    "total_duration_seconds": 125.3
  }
}
```

---

## Troubleshooting

### APScheduler Not Found

**Error:** `ImportError: No module named 'apscheduler'`

**Solution:**
```bash
pip install apscheduler>=3.10.0
```

### eBay API Fails

**Error:** Data collection shows 0 eBay records

**Causes:**
- API token expired or invalid (check `.env`)
- Rate limiting (API quota exceeded)
- Network connectivity issue

**Solution:**
- Verify `EBAY_API_TOKEN` in `.env`
- Check eBay API rate limits in [eBay Developer Dashboard](https://developer.ebay.com)
- Scheduler will continue with Bungle data if eBay fails (Graceful Degradation)

### Bungle Crawler Blocked

**Error:** Connection timeout or 403 error

**Solution:**
- Bungle may have rate limiting. Scheduler will retry on next run
- Check `logs/pipeline.log` for specific error messages
- Graceful Degradation ensures pipeline continues

### npm run db:seed Fails

**Error:** `npm: command not found`

**Solution:**
- Ensure Node.js is installed: `node --version`
- Database seeding is optional; scheduler will skip if npm unavailable

**Error:** PostgreSQL connection failed

**Solution:**
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- See `docs/DEPLOYMENT_CHECKLIST.md` for setup

### Image Processing Skipped

**Expected:** If `scripts/sample_images/` directory doesn't exist

**Solution:**
- Create directory and add sample photocard images to process
- Or add existing images: `scripts/sample_images/*.jpg`

---

## Integration with Cron (Linux/Mac)

To run the scheduler as a recurring background task:

### crontab Setup

```bash
# Edit cron jobs
crontab -e

# Add line to run daemon every boot
@reboot cd /path/to/D:/StanPC && python scripts/scheduler.py --daemon >> logs/scheduler.log 2>&1 &
```

### systemd Service (Linux)

Create `/etc/systemd/system/stanpc-scheduler.service`:

```ini
[Unit]
Description=StanPC Data Pipeline Scheduler
After=network.target

[Service]
Type=simple
User=myuser
WorkingDirectory=/path/to/D:/StanPC
ExecStart=/usr/bin/python3 scripts/scheduler.py --daemon
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable stanpc-scheduler.service
sudo systemctl start stanpc-scheduler.service
sudo systemctl status stanpc-scheduler.service
```

---

## Performance Tuning

### Reduce Crawling Load

Lower search keyword count or results per search:

```python
# In StanPCDataPipeline
self.step_collect_ebay_data(self.SEARCH_KEYWORDS[:1])  # Only 1 keyword
```

### Increase Interval

Change 6 hours to 12 hours:

```python
class PipelineScheduler:
    INTERVAL_HOURS = 12
```

### Disable Optional Phases

Comment out in `StanPCDataPipeline.run()`:

```python
# Skip image processing
# self.step_process_images()

# Skip database seeding
# self.step_db_seed()
```

---

## API Reference

### PipelineScheduler

```python
scheduler = PipelineScheduler()

# Start 6-hourly daemon
scheduler.start()

# Run once without scheduling
run = scheduler.run_once()

# Stop daemon
scheduler.stop()
```

### StanPCDataPipeline

```python
pipeline = StanPCDataPipeline()

# Execute complete pipeline
run = pipeline.run()

# Access results
print(run.overall_status)  # "success" | "partial_success" | "failed"
print(run.steps)  # List[PipelineStep]
print(run.summary)  # Dict with counts
```

### PipelineRun

```python
# Complete run record
run.run_id              # "20250811_123456"
run.overall_status      # PipelineStatus enum
run.steps               # List[PipelineStep]
run.summary             # Summary statistics
run.to_dict()           # Convert to JSON-serializable dict
```

---

## Next Steps

1. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Set up production database
2. **[TRACK_B_STATUS.md](TRACK_B_STATUS.md)** - Data pipeline details
3. **[api-spec.md](../lib/api-spec.md)** - API endpoints for accessing data

---

## Support

For issues or questions:
1. Check `logs/pipeline.log` for detailed error messages
2. Run in `--once` mode to debug without scheduling
3. Review `logs/runs/{run_id}_record.json` for complete execution details
4. Check [SESSION_HANDOFF.md](SESSION_HANDOFF.md) for project context
