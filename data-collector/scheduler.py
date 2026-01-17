"""
Automated Data Collection Scheduler
매일 정해진 시간에 데이터 수집 및 프론트엔드 복사를 자동 실행
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, time
from typing import Optional
import yaml
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from loguru import logger

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from main import DataCollectionPipeline
from utils.data_copier import DataCopier
from config.settings import LOGGING


class AutomatedDataCollector:
    """Automated scheduler for data collection and frontend data updates"""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize automated collector

        Args:
            config_path: Path to scheduler configuration file
        """
        # Load configuration
        if config_path is None:
            config_path = project_root / "config" / "scheduler_config.yaml"

        self.config = self._load_config(config_path)

        # Initialize scheduler
        self.scheduler = AsyncIOScheduler(
            timezone=self.config["schedule"]["timezone"]
        )

        # Setup logging
        self._setup_logging()

        # Components
        self.data_copier = DataCopier(config_path)
        self.retry_count = 0
        self.max_retries = self.config.get("retry", {}).get("max_attempts", 3)

        logger.info("=" * 70)
        logger.info("🤖 Automated Data Collector Initialized")
        logger.info("=" * 70)
        logger.info(f"Schedule: Daily at {self.config['schedule']['daily_run_time']}")
        logger.info(f"Timezone: {self.config['schedule']['timezone']}")
        logger.info(f"Execution Mode: {self.config['schedule']['execution_mode']}")
        logger.info("=" * 70)

    def _load_config(self, config_path: Path) -> dict:
        """Load scheduler configuration from YAML"""
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
                logger.info(f"Loaded configuration from: {config_path}")
                return config
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            raise

    def _setup_logging(self):
        """Setup logging for scheduler"""
        log_config = self.config.get("logging", {})

        log_file = log_config.get("log_file", "logs/scheduler_{time}.log")
        log_level = log_config.get("level", "INFO")
        rotation = log_config.get("rotation", "10 MB")
        retention = log_config.get("retention", "30 days")

        # Add scheduler-specific log handler
        logger.add(
            log_file,
            rotation=rotation,
            retention=retention,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
        )

        logger.info("Logging configured for scheduler")

    async def run_data_collection(self):
        """Execute the data collection pipeline"""
        logger.info("\n" + "=" * 70)
        logger.info(f"🚀 Starting Scheduled Data Collection")
        logger.info(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        try:
            # Run data collection pipeline
            pipeline = DataCollectionPipeline()

            execution_mode = self.config["schedule"]["execution_mode"]

            if execution_mode == "full":
                await pipeline.run_full_pipeline()
            elif execution_mode == "scrape-only":
                logger.info("Running scrape-only mode...")
                # Only scraping steps
                await pipeline.collect_product_details()
                await pipeline.collect_rankings()
                await pipeline.collect_reviews()
                pipeline.save_raw_data()
            else:
                logger.error(f"Unknown execution mode: {execution_mode}")
                return False

            logger.success("\n✅ Data collection completed successfully!")

            # Copy data to frontend if enabled
            if self.config.get("data_copy", {}).get("enabled", True):
                logger.info("\n" + "=" * 70)
                logger.info("📦 Copying data to frontend...")
                logger.info("=" * 70)

                results = self.data_copier.copy_all_files()

                # Verify copied files
                self.data_copier.verify_frontend_data()

                if not all(results.values()):
                    logger.warning("⚠️ Some files failed to copy")

            # Reset retry count on success
            self.retry_count = 0

            logger.success("\n" + "=" * 70)
            logger.success("🎉 SCHEDULED TASK COMPLETED SUCCESSFULLY!")
            logger.success("=" * 70)

            # Send success notification if enabled
            self._send_notification("success")

            return True

        except Exception as e:
            logger.error(f"\n❌ Scheduled task failed: {e}")
            logger.exception("Full error traceback:")

            # Handle retry logic
            await self._handle_failure()

            return False

    async def _handle_failure(self):
        """Handle task failure with retry logic"""
        retry_config = self.config.get("retry", {})
        retry_on_failure = retry_config.get("retry_on_failure", True)
        retry_interval = retry_config.get("retry_interval", 10)

        if retry_on_failure and self.retry_count < self.max_retries:
            self.retry_count += 1
            logger.warning(
                f"⚠️ Retry attempt {self.retry_count}/{self.max_retries} "
                f"in {retry_interval} minutes..."
            )

            # Schedule retry
            await asyncio.sleep(retry_interval * 60)
            await self.run_data_collection()
        else:
            logger.error(
                f"❌ Max retries ({self.max_retries}) reached or retry disabled. "
                "Giving up."
            )

            # Send failure notification
            self._send_notification("failure")

            # Reset retry count for next scheduled run
            self.retry_count = 0

    def _send_notification(self, status: str):
        """
        Send notification on task completion/failure

        Args:
            status: 'success' or 'failure'
        """
        notification_config = self.config.get("notifications", {})

        if status == "success":
            enabled = notification_config.get("on_success", {}).get("enabled", False)
        else:
            enabled = notification_config.get("on_failure", {}).get("enabled", False)

        if not enabled:
            return

        # TODO: Implement email/Slack notifications
        logger.info(f"📧 Notification ({status}): Feature coming soon!")

    def _job_listener(self, event):
        """Listen to job execution events"""
        if event.exception:
            logger.error(f"Job failed with exception: {event.exception}")
        else:
            logger.info(f"Job executed successfully at {datetime.now()}")

    def start(self):
        """Start the scheduler"""
        # Parse schedule time
        run_time = self.config["schedule"]["daily_run_time"]
        hour, minute = map(int, run_time.split(":"))

        # Create cron trigger for daily execution
        trigger = CronTrigger(
            hour=hour,
            minute=minute,
            timezone=self.config["schedule"]["timezone"],
        )

        # Add scheduled job
        self.scheduler.add_job(
            self.run_data_collection,
            trigger=trigger,
            id="daily_data_collection",
            name="Daily Amazon Data Collection",
            coalesce=self.config.get("performance", {}).get("coalesce", True),
            max_instances=1,  # Only one instance at a time
            misfire_grace_time=3600,  # 1 hour grace period
        )

        # Add event listener
        self.scheduler.add_listener(
            self._job_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR
        )

        # Run immediately on startup if configured
        if self.config.get("performance", {}).get("run_on_startup", False):
            logger.info("🚀 Running initial data collection on startup...")
            self.scheduler.add_job(
                self.run_data_collection,
                id="startup_collection",
                name="Startup Data Collection"
            )

        # Start scheduler
        self.scheduler.start()

        logger.info("\n" + "=" * 70)
        logger.success("✅ Scheduler started successfully!")
        logger.info(f"⏰ Next run: {self.scheduler.get_jobs()[0].next_run_time}")
        logger.info("=" * 70)
        logger.info("\n💡 Scheduler is running in the background...")
        logger.info("   Press Ctrl+C to stop\n")

    def stop(self):
        """Stop the scheduler"""
        logger.info("\n🛑 Stopping scheduler...")
        self.scheduler.shutdown(wait=True)
        logger.success("✅ Scheduler stopped")


async def main():
    """Main entry point for scheduler"""
    # Check for development mode
    import os
    dev_mode = os.getenv("DEV_MODE", "False").lower() == "true"

    if dev_mode:
        logger.warning("⚠️ Running in DEVELOPMENT MODE")
        # Modify config for testing
        config_path = project_root / "config" / "scheduler_config.yaml"
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        if config.get("development", {}).get("enabled", False):
            test_interval = config["development"]["test_interval_minutes"]
            logger.info(f"📝 Test mode: Running every {test_interval} minutes")

            # Create test scheduler with interval trigger
            from apscheduler.triggers.interval import IntervalTrigger

            collector = AutomatedDataCollector()
            collector.scheduler.add_job(
                collector.run_data_collection,
                trigger=IntervalTrigger(minutes=test_interval),
                id="test_collection",
                name="Test Data Collection"
            )
            collector.scheduler.start()
        else:
            collector = AutomatedDataCollector()
            collector.start()
    else:
        # Production mode
        collector = AutomatedDataCollector()
        collector.start()

    try:
        # Keep the scheduler running
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("\n⚠️ Received exit signal")
        collector.stop()


if __name__ == "__main__":
    asyncio.run(main())
