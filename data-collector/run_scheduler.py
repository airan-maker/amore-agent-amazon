"""
Scheduler Runner Script
스케줄러를 실행하는 간단한 진입점
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from scheduler import main


if __name__ == "__main__":
    print("=" * 70)
    print("Amazon Data Collection Scheduler")
    print("=" * 70)
    print("\n Starting scheduler...")
    print(" The scheduler will run data collection at the configured time.")
    print(" Press Ctrl+C to stop the scheduler.\n")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n🛑 Scheduler stopped by user")
        sys.exit(0)
