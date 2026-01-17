"""
Import existing product data to cache
Converts collected product data files into cache format
"""
import json
from pathlib import Path
from datetime import datetime
from loguru import logger
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from utils.cache_manager import CacheManager
from config.settings import DATA_DIR


def find_latest_products_file() -> Path:
    """Find the most recent products data file"""
    products_files = list(DATA_DIR.glob("products_*.json"))

    # Exclude progress file
    products_files = [f for f in products_files if "progress" not in f.name]

    if not products_files:
        raise FileNotFoundError("No products data files found")

    # Sort by filename (contains timestamp)
    products_files.sort(reverse=True)
    latest = products_files[0]

    logger.info(f"Found latest products file: {latest.name}")
    return latest


def import_products_to_cache(products_file: Path, cache_manager: CacheManager):
    """
    Import products from data file to cache

    Args:
        products_file: Path to products JSON file
        cache_manager: CacheManager instance
    """
    logger.info(f"Reading products from: {products_file}")

    with open(products_file, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    total_products = len(products_data)
    logger.info(f"Found {total_products} products to import")

    imported_count = 0
    skipped_count = 0

    for asin, product_data in products_data.items():
        # Skip if product has error
        if "error" in product_data and not product_data.get("brand"):
            logger.debug(f"Skipping {asin} - error entry")
            skipped_count += 1
            continue

        # Skip if missing essential data
        if not product_data.get("brand") and not product_data.get("product_name"):
            logger.debug(f"Skipping {asin} - no essential data")
            skipped_count += 1
            continue

        # Import to cache
        cache_manager.set(asin, product_data)
        imported_count += 1

        if imported_count % 100 == 0:
            logger.info(f"Progress: {imported_count}/{total_products}")

    logger.success(f"\n{'='*60}")
    logger.success(f"Import completed!")
    logger.success(f"  ✓ Imported: {imported_count}")
    logger.success(f"  ⊘ Skipped: {skipped_count}")
    logger.success(f"  Total: {total_products}")
    logger.success(f"{'='*60}")

    return imported_count, skipped_count


def main():
    """Main entry point"""
    logger.info("=" * 60)
    logger.info("Import Existing Products to Cache")
    logger.info("=" * 60)

    try:
        # Find latest products file
        products_file = find_latest_products_file()

        # Initialize cache manager
        cache_dir = DATA_DIR / "cache"
        cache_ttl = 24  # 24 hours
        cache_manager = CacheManager(cache_dir, cache_ttl_hours=cache_ttl)

        # Show current cache stats
        before_stats = cache_manager.get_stats()
        logger.info(f"\nCache stats before import:")
        logger.info(f"  - Valid entries: {before_stats['valid_entries']}")
        logger.info(f"  - Expired entries: {before_stats['expired_entries']}")
        logger.info(f"  - Total entries: {before_stats['total_entries']}")

        # Import products
        logger.info("\nStarting import...\n")
        imported, skipped = import_products_to_cache(products_file, cache_manager)

        # Show final cache stats
        after_stats = cache_manager.get_stats()
        logger.info(f"\nCache stats after import:")
        logger.info(f"  - Valid entries: {after_stats['valid_entries']}")
        logger.info(f"  - Total entries: {after_stats['total_entries']}")
        logger.info(f"  - Cache TTL: {after_stats['cache_ttl_hours']} hours")

        logger.info(f"\n💡 Benefits:")
        logger.info(f"  - Next run will use cached data for {imported} products")
        logger.info(f"  - Estimated time saved: ~{imported * 2 // 5 // 60} minutes")
        logger.info(f"  - Cache valid until: {datetime.now().replace(hour=(datetime.now().hour + 24) % 24).strftime('%Y-%m-%d %H:%M')}")

    except Exception as e:
        logger.error(f"Import failed: {e}")
        raise


if __name__ == "__main__":
    main()
