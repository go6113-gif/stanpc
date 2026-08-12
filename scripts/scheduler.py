#!/usr/bin/env python3
"""
Scheduler for StanPC Data Pipeline
- Runs collection → processing → DB ingestion on a 6-hour interval
- Implements Graceful Degradation with structured logging
- Logs all events to logs/pipeline.log in JSON format
"""

import json
import logging
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

# APScheduler for scheduled tasks
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger
except ImportError:
    print("❌ APScheduler not installed. Install with: pip install apscheduler")
    sys.exit(1)

# Import data pipeline modules
sys.path.insert(0, str(Path(__file__).parent))

from seed_market_data import SeedDataGenerator
from image_pipeline import ImagePipeline
from analytics import PriceAnalyzer

# ============================================================================
# Logging Configuration
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
LOGS_DIR = SCRIPT_DIR.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

LOG_FILE = LOGS_DIR / "pipeline.log"

# Set up JSON structured logging
class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging"""

    def format(self, record):
        log_dict = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "lineno": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_dict["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "pipeline_step"):
            log_dict["pipeline_step"] = record.pipeline_step
        if hasattr(record, "duration_seconds"):
            log_dict["duration_seconds"] = record.duration_seconds
        if hasattr(record, "records_count"):
            log_dict["records_count"] = record.records_count
        if hasattr(record, "status"):
            log_dict["status"] = record.status

        return json.dumps(log_dict, ensure_ascii=False)

# Configure root logger
logger = logging.getLogger("scheduler")
logger.setLevel(logging.DEBUG)

# File handler (JSON)
file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(JSONFormatter())
logger.addHandler(file_handler)

# Console handler (human readable)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - [%(name)s] %(message)s'
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# ============================================================================
# Pipeline Status Tracking
# ============================================================================

class PipelineStatus(Enum):
    """Status codes for pipeline operations"""
    SUCCESS = "success"
    PARTIAL = "partial_success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class PipelineStep:
    """Tracks execution of a single pipeline step"""
    name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: PipelineStatus = PipelineStatus.FAILED
    error: Optional[str] = None
    records_count: Optional[int] = None
    details: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": (self.end_time - self.start_time).total_seconds() if self.end_time else None,
            "status": self.status.value,
            "error": self.error,
            "records_count": self.records_count,
            "details": self.details or {},
        }


@dataclass
class PipelineRun:
    """Complete pipeline execution record"""
    run_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    overall_status: PipelineStatus = PipelineStatus.FAILED
    steps: List[PipelineStep] = None
    summary: Dict[str, Any] = None

    def __post_init__(self):
        if self.steps is None:
            self.steps = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": (self.end_time - self.start_time).total_seconds() if self.end_time else None,
            "overall_status": self.overall_status.value,
            "steps": [step.to_dict() for step in self.steps],
            "summary": self.summary or {},
        }

# ============================================================================
# Pipeline Implementation
# ============================================================================

class StanPCDataPipeline:
    """Main data collection and processing pipeline"""

    SEARCH_KEYWORDS = [
        "TWICE TZUYU 포토카드",
        "BLACKPINK JENNIE 포토카드",
        "EXO SEHUN 포토카드",
        "Stray Kids FELIX photocard",
        "SEVENTEEN photocard",
        "Red Velvet photocard",
        "TXT YEONJUN photocard",
    ]

    SAMPLE_IMAGES_DIR = SCRIPT_DIR / "sample_images"
    OUTPUT_DIR = SCRIPT_DIR / "output"
    SEED_DATA_DIR = SCRIPT_DIR / "seed_data"

    def __init__(self):
        self.run_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.run_record = PipelineRun(
            run_id=self.run_id,
            start_time=datetime.utcnow()
        )
        self.seed_generator = SeedDataGenerator()
        self.image_pipeline = ImagePipeline(output_dir=str(self.OUTPUT_DIR))
        self.price_analyzer = PriceAnalyzer()

    def _log_step(self, step: PipelineStep):
        """Log a pipeline step with structured format"""
        logger.info(
            f"Pipeline Step: {step.name} - {step.status.value}",
            extra={
                "pipeline_step": step.name,
                "status": step.status.value,
                "duration_seconds": (step.end_time - step.start_time).total_seconds() if step.end_time else None,
                "records_count": step.records_count,
            }
        )
        self.run_record.steps.append(step)

    def step_collect_ebay_data(self) -> PipelineStep:
        """Gracefully collect eBay data with error handling"""
        step = PipelineStep(
            name="collect_ebay_data",
            start_time=datetime.utcnow()
        )

        try:
            logger.info("Starting eBay data collection...")
            self.seed_generator.collect_ebay_data(self.SEARCH_KEYWORDS[:3])

            step.records_count = len(self.seed_generator.price_history_records)
            step.status = PipelineStatus.SUCCESS if step.records_count > 0 else PipelineStatus.PARTIAL
            step.end_time = datetime.utcnow()

            logger.info(f"✓ eBay collection completed: {step.records_count} price records")

        except Exception as e:
            step.status = PipelineStatus.PARTIAL
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ eBay collection failed (will continue): {e}", exc_info=True)

        self._log_step(step)
        return step

    def step_collect_bungle_data(self) -> PipelineStep:
        """Gracefully collect Bungle data with error handling"""
        step = PipelineStep(
            name="collect_bungle_data",
            start_time=datetime.utcnow()
        )

        try:
            logger.info("Starting Bungle data collection...")
            self.seed_generator.collect_bungle_data(self.SEARCH_KEYWORDS[:3])

            step.records_count = len(self.seed_generator.price_history_records)
            step.status = PipelineStatus.SUCCESS if step.records_count > 0 else PipelineStatus.PARTIAL
            step.end_time = datetime.utcnow()

            logger.info(f"✓ Bungle collection completed: {step.records_count} total price records")

        except Exception as e:
            step.status = PipelineStatus.PARTIAL
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ Bungle collection failed (will continue): {e}", exc_info=True)

        self._log_step(step)
        return step

    def step_process_images(self) -> PipelineStep:
        """Gracefully process images with error handling"""
        step = PipelineStep(
            name="process_images",
            start_time=datetime.utcnow()
        )

        try:
            if not self.SAMPLE_IMAGES_DIR.exists():
                logger.warning(f"Sample images directory not found: {self.SAMPLE_IMAGES_DIR}")
                step.status = PipelineStatus.SKIPPED
                step.error = "No sample images directory"
                step.end_time = datetime.utcnow()
            else:
                logger.info("Starting image processing...")
                self.OUTPUT_DIR.mkdir(exist_ok=True)

                # Process all images in sample_images directory using batch processor
                batch_result = self.image_pipeline.process_batch(
                    image_dir=str(self.SAMPLE_IMAGES_DIR),
                    generate_thumbnail=True
                )

                processed_count = batch_result.get("total_cards_saved", 0)
                total_cards = batch_result.get("total_cards_detected", 0)

                step.records_count = processed_count
                step.status = PipelineStatus.SUCCESS if processed_count > 0 else PipelineStatus.PARTIAL
                step.end_time = datetime.utcnow()
                step.details = {
                    "total_images": batch_result.get("total_images", 0),
                    "cards_detected": total_cards,
                    "cards_saved": processed_count,
                }

                logger.info(f"✓ Image processing completed: {processed_count}/{total_cards} cards saved")

        except Exception as e:
            step.status = PipelineStatus.PARTIAL
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ Image processing failed (will continue): {e}", exc_info=True)

        self._log_step(step)
        return step

    def step_analyze_prices(self) -> PipelineStep:
        """Gracefully analyze price data with error handling"""
        step = PipelineStep(
            name="analyze_prices",
            start_time=datetime.utcnow()
        )

        try:
            logger.info("Starting price analysis...")

            # Analyze collected price history
            for record in self.seed_generator.price_history_records:
                self.price_analyzer.add_price_point(
                    card_id=record.get("photocard_slug", "unknown"),
                    card_name=record.get("photocard_slug", "unknown"),
                    price=record.get("price", 0),
                    currency=record.get("currency", "USD"),
                    market=record.get("market", "unknown"),
                    source_url=record.get("sourceUrl"),
                    timestamp=record.get("createdAt")
                )

            # Analyze all cards
            analyses = self.price_analyzer.analyze_all()

            step.records_count = len(analyses)
            step.status = PipelineStatus.SUCCESS if step.records_count > 0 else PipelineStatus.PARTIAL
            step.end_time = datetime.utcnow()
            step.details = {"analyzed_cards": step.records_count}

            logger.info(f"✓ Price analysis completed: {step.records_count} cards analyzed")

        except Exception as e:
            step.status = PipelineStatus.PARTIAL
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ Price analysis failed (will continue): {e}", exc_info=True)

        self._log_step(step)
        return step

    def step_save_seed_data(self) -> PipelineStep:
        """Gracefully save seed data with error handling"""
        step = PipelineStep(
            name="save_seed_data",
            start_time=datetime.utcnow()
        )

        try:
            logger.info("Saving seed data to JSON...")

            seed_file = self.seed_generator.save_seed_data()

            step.status = PipelineStatus.SUCCESS
            step.end_time = datetime.utcnow()
            step.records_count = (
                len(self.seed_generator.price_history_records) +
                len(self.seed_generator.sku_mapping_records)
            )
            step.details = {
                "seed_file": str(seed_file),
                "price_history_count": len(self.seed_generator.price_history_records),
                "sku_mapping_count": len(self.seed_generator.sku_mapping_records),
            }

            logger.info(f"✓ Seed data saved: {step.records_count} total records")

        except Exception as e:
            step.status = PipelineStatus.FAILED
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ Failed to save seed data: {e}", exc_info=True)

        self._log_step(step)
        return step

    def step_db_seed(self) -> PipelineStep:
        """Gracefully run Node.js database seeding with error handling"""
        step = PipelineStep(
            name="db_seed",
            start_time=datetime.utcnow()
        )

        try:
            logger.info("Starting database seeding with npm run db:seed...")

            # Change to project root directory for npm command
            project_root = SCRIPT_DIR.parent

            result = subprocess.run(
                ["npm", "run", "db:seed"],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode == 0:
                step.status = PipelineStatus.SUCCESS
                logger.info("✓ Database seeding completed successfully")
            else:
                step.status = PipelineStatus.PARTIAL
                step.error = f"npm command returned {result.returncode}"
                logger.warning(f"✗ Database seeding returned non-zero: {result.stderr[:200]}")

            step.end_time = datetime.utcnow()
            step.details = {
                "return_code": result.returncode,
                "stdout_length": len(result.stdout),
            }

        except subprocess.TimeoutExpired:
            step.status = PipelineStatus.PARTIAL
            step.error = "npm run db:seed timeout (5 minutes)"
            step.end_time = datetime.utcnow()
            logger.warning(f"✗ Database seeding timeout")

        except FileNotFoundError:
            step.status = PipelineStatus.SKIPPED
            step.error = "npm not found (ensure Node.js is installed)"
            step.end_time = datetime.utcnow()
            logger.warning(f"✗ npm not found, skipping database seeding")

        except Exception as e:
            step.status = PipelineStatus.PARTIAL
            step.error = str(e)
            step.end_time = datetime.utcnow()
            logger.error(f"✗ Database seeding failed: {e}", exc_info=True)

        self._log_step(step)
        return step

    def run(self) -> PipelineRun:
        """Execute complete pipeline with Graceful Degradation"""
        try:
            logger.info("=" * 70)
            logger.info(f"🚀 Starting StanPC Data Pipeline Run: {self.run_id}")
            logger.info("=" * 70)

            # Phase 1: Data Collection (Graceful Degradation)
            logger.info("\n📊 Phase 1: Data Collection")
            self.step_collect_ebay_data()
            self.step_collect_bungle_data()

            # Phase 2: Image Processing (Optional, doesn't block)
            logger.info("\n🖼️  Phase 2: Image Processing")
            self.step_process_images()

            # Phase 3: Data Analysis
            logger.info("\n📈 Phase 3: Price Analysis")
            self.step_analyze_prices()

            # Phase 4: Save Seed Data
            logger.info("\n💾 Phase 4: Save Seed Data")
            self.step_save_seed_data()

            # Phase 5: Database Seeding (Optional)
            logger.info("\n🗄️  Phase 5: Database Seeding")
            self.step_db_seed()

            # Finalize run
            self.run_record.end_time = datetime.utcnow()

            # Determine overall status
            step_statuses = [step.status for step in self.run_record.steps]
            if all(s == PipelineStatus.SUCCESS for s in step_statuses):
                self.run_record.overall_status = PipelineStatus.SUCCESS
            elif any(s == PipelineStatus.SUCCESS or s == PipelineStatus.PARTIAL for s in step_statuses):
                self.run_record.overall_status = PipelineStatus.PARTIAL
            else:
                self.run_record.overall_status = PipelineStatus.FAILED

            # Generate summary
            self.run_record.summary = {
                "total_steps": len(self.run_record.steps),
                "successful_steps": sum(1 for s in self.run_record.steps if s.status == PipelineStatus.SUCCESS),
                "partial_steps": sum(1 for s in self.run_record.steps if s.status == PipelineStatus.PARTIAL),
                "skipped_steps": sum(1 for s in self.run_record.steps if s.status == PipelineStatus.SKIPPED),
                "failed_steps": sum(1 for s in self.run_record.steps if s.status == PipelineStatus.FAILED),
                "total_duration_seconds": (self.run_record.end_time - self.run_record.start_time).total_seconds(),
            }

            # Log final status
            logger.info("=" * 70)
            logger.info(f"✅ Pipeline Run Complete: {self.run_record.overall_status.value.upper()}")
            logger.info(f"   Duration: {self.run_record.summary['total_duration_seconds']:.1f}s")
            logger.info(f"   Successful: {self.run_record.summary['successful_steps']} | "
                       f"Partial: {self.run_record.summary['partial_steps']} | "
                       f"Skipped: {self.run_record.summary['skipped_steps']}")
            logger.info("=" * 70)

            # Save run record to JSON
            self._save_run_record()

            return self.run_record

        except Exception as e:
            logger.critical(f"Pipeline execution critical error: {e}", exc_info=True)
            self.run_record.end_time = datetime.utcnow()
            self.run_record.overall_status = PipelineStatus.FAILED
            return self.run_record

    def _save_run_record(self):
        """Save run execution record to JSON"""
        try:
            runs_dir = LOGS_DIR / "runs"
            runs_dir.mkdir(exist_ok=True)

            run_file = runs_dir / f"{self.run_id}_record.json"

            with open(run_file, "w", encoding="utf-8") as f:
                json.dump(self.run_record.to_dict(), f, indent=2, ensure_ascii=False)

            logger.info(f"Run record saved to: {run_file}")

        except Exception as e:
            logger.error(f"Failed to save run record: {e}")

# ============================================================================
# Scheduler
# ============================================================================

class PipelineScheduler:
    """Manages scheduled pipeline execution"""

    INTERVAL_HOURS = 6  # Run every 6 hours

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_listener(self._scheduler_listener)

    def _scheduler_listener(self, event):
        """Log scheduler events"""
        if event.exception:
            logger.error(f"Scheduled job failed: {event.exception}", exc_info=event.exception)
        else:
            logger.info(f"Scheduled job completed successfully")

    def _job_callback(self):
        """Callback for scheduled job execution"""
        pipeline = StanPCDataPipeline()
        pipeline.run()

    def start(self):
        """Start the scheduler"""
        try:
            logger.info(f"Starting scheduler (interval: {self.INTERVAL_HOURS} hours)...")

            self.scheduler.add_job(
                self._job_callback,
                trigger=IntervalTrigger(hours=self.INTERVAL_HOURS),
                id="stanpc_pipeline",
                name="StanPC Data Pipeline",
                replace_existing=True
            )

            self.scheduler.start()
            logger.info("✓ Scheduler started successfully")

            # Run immediately on startup for testing
            logger.info("Running pipeline immediately on startup...")
            self._job_callback()

        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}", exc_info=True)
            raise

    def stop(self):
        """Stop the scheduler"""
        try:
            self.scheduler.shutdown()
            logger.info("✓ Scheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")

    def run_once(self):
        """Run pipeline once without scheduling"""
        logger.info("Running pipeline once (no scheduling)...")
        pipeline = StanPCDataPipeline()
        return pipeline.run()

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point"""
    import time

    logger.info("StanPC Data Pipeline Scheduler v1.0")
    logger.info(f"Log file: {LOG_FILE}")

    # Check if running in daemon mode or one-time mode
    if "--once" in sys.argv:
        # Run pipeline once and exit
        logger.info("Running in one-time mode...")
        scheduler = PipelineScheduler()
        scheduler.run_once()

    elif "--daemon" in sys.argv:
        # Start scheduler daemon
        logger.info("Running in daemon mode (press Ctrl+C to stop)...")
        scheduler = PipelineScheduler()

        try:
            scheduler.start()
            # Keep the scheduler running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received, shutting down...")
            scheduler.stop()
        except Exception as e:
            logger.error(f"Daemon error: {e}", exc_info=True)
            scheduler.stop()

    else:
        # Default: run once
        logger.info("Running in one-time mode (use --daemon for scheduler)...")
        scheduler = PipelineScheduler()
        scheduler.run_once()

if __name__ == "__main__":
    main()
