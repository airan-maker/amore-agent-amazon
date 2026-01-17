"""
Convert Stage 2 collection data to Master Database format
Converts products_*.json and reviews_*.json to ASIN-keyed master databases
"""
import json
from pathlib import Path
from datetime import datetime
from loguru import logger
from glob import glob

from config.settings import DATA_DIR


def convert_to_master_db(products_file: str, reviews_file: str):
    """
    Convert Stage 2 data to master database format

    Args:
        products_file: Path to products JSON file (e.g., products_20260109_144957.json)
        reviews_file: Path to reviews JSON file (e.g., reviews_20260109_144957.json)
    """
    logger.info("=" * 60)
    logger.info("Converting Stage 2 Data to Master Database")
    logger.info("=" * 60)

    # Create master directory
    master_dir = DATA_DIR / "master"
    master_dir.mkdir(exist_ok=True)
    logger.info(f"Master DB directory: {master_dir}")

    # Load existing master DBs if they exist
    products_master_path = master_dir / "products_master.json"
    reviews_master_path = master_dir / "reviews_master.json"
    metadata_path = master_dir / "collection_metadata.json"

    products_master = {}
    reviews_master = {}
    metadata = {
        "total_asins": 0,
        "last_full_refresh": None,
        "next_full_refresh": None,
        "asins_by_status": {
            "fresh": 0,
            "stale": 0
        }
    }

    # Load existing master DBs if they exist
    if products_master_path.exists():
        logger.info("Loading existing products_master.json...")
        with open(products_master_path, "r", encoding="utf-8") as f:
            products_master = json.load(f)
        logger.info(f"  Found {len(products_master)} existing products")

    if reviews_master_path.exists():
        logger.info("Loading existing reviews_master.json...")
        with open(reviews_master_path, "r", encoding="utf-8") as f:
            reviews_master = json.load(f)
        logger.info(f"  Found {len(reviews_master)} existing review sets")

    if metadata_path.exists():
        logger.info("Loading existing metadata...")
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

    # Load Stage 2 data
    logger.info(f"\nLoading Stage 2 products from: {products_file}")
    with open(products_file, "r", encoding="utf-8") as f:
        stage2_products = json.load(f)
    logger.info(f"  Loaded {len(stage2_products)} products")

    logger.info(f"Loading Stage 2 reviews from: {reviews_file}")
    with open(reviews_file, "r", encoding="utf-8") as f:
        stage2_reviews = json.load(f)
    logger.info(f"  Loaded {len(stage2_reviews)} review sets")

    # Current timestamp
    now = datetime.now().isoformat()
    today = datetime.now().strftime("%Y-%m-%d")

    # Convert products to master format
    logger.info("\nConverting products to master format...")
    new_asins = 0
    updated_asins = 0

    for asin, product_data in stage2_products.items():
        if "error" in product_data:
            logger.warning(f"  Skipping {asin} (error in source data)")
            continue

        is_new = asin not in products_master

        # Create or update master entry
        if is_new:
            products_master[asin] = {
                "asin": asin,
                "brand": product_data.get("brand"),
                "product_name": product_data.get("product_name"),
                "first_collected": now,
                "last_updated": now,
                "update_count": 1,
                "data": product_data
            }
            new_asins += 1
        else:
            # Update existing entry
            products_master[asin]["last_updated"] = now
            products_master[asin]["update_count"] = products_master[asin].get("update_count", 1) + 1
            products_master[asin]["data"] = product_data
            # Update brand/name if they changed
            products_master[asin]["brand"] = product_data.get("brand")
            products_master[asin]["product_name"] = product_data.get("product_name")
            updated_asins += 1

    logger.success(f"  ✓ Converted {len(stage2_products)} products")
    logger.info(f"    - New: {new_asins}")
    logger.info(f"    - Updated: {updated_asins}")

    # Convert reviews to master format
    logger.info("\nConverting reviews to master format...")
    new_review_sets = 0
    updated_review_sets = 0

    for asin, review_data in stage2_reviews.items():
        is_new = asin not in reviews_master

        # Create or update master entry
        if is_new:
            reviews_master[asin] = {
                "asin": asin,
                "first_collected": now,
                "last_updated": now,
                "update_count": 1,
                "reviews": review_data.get("reviews", []),
                "count": review_data.get("count", 0)
            }
            new_review_sets += 1
        else:
            # Update existing entry
            reviews_master[asin]["last_updated"] = now
            reviews_master[asin]["update_count"] = reviews_master[asin].get("update_count", 1) + 1
            reviews_master[asin]["reviews"] = review_data.get("reviews", [])
            reviews_master[asin]["count"] = review_data.get("count", 0)
            updated_review_sets += 1

    logger.success(f"  ✓ Converted {len(stage2_reviews)} review sets")
    logger.info(f"    - New: {new_review_sets}")
    logger.info(f"    - Updated: {updated_review_sets}")

    # Update metadata
    logger.info("\nUpdating metadata...")
    metadata["total_asins"] = len(products_master)
    metadata["last_full_refresh"] = today

    # Calculate next full refresh (30 days from now)
    from datetime import timedelta
    next_refresh = datetime.now() + timedelta(days=30)
    metadata["next_full_refresh"] = next_refresh.strftime("%Y-%m-%d")

    # Calculate fresh vs stale
    fresh_count = 0
    stale_count = 0
    for asin, data in products_master.items():
        last_updated = datetime.fromisoformat(data["last_updated"])
        days_old = (datetime.now() - last_updated).days
        if days_old < 30:
            fresh_count += 1
        else:
            stale_count += 1

    metadata["asins_by_status"]["fresh"] = fresh_count
    metadata["asins_by_status"]["stale"] = stale_count

    # Save master databases
    logger.info("\nSaving master databases...")

    with open(products_master_path, "w", encoding="utf-8") as f:
        json.dump(products_master, f, indent=2, ensure_ascii=False)
    logger.success(f"  ✓ Saved: {products_master_path}")
    logger.info(f"    - Total products: {len(products_master)}")

    with open(reviews_master_path, "w", encoding="utf-8") as f:
        json.dump(reviews_master, f, indent=2, ensure_ascii=False)
    logger.success(f"  ✓ Saved: {reviews_master_path}")
    logger.info(f"    - Total review sets: {len(reviews_master)}")

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    logger.success(f"  ✓ Saved: {metadata_path}")

    # Summary
    logger.info("\n" + "=" * 60)
    logger.success("Master Database Conversion Complete!")
    logger.info("=" * 60)
    logger.info(f"Total ASINs: {metadata['total_asins']}")
    logger.info(f"  - Fresh (<30 days): {metadata['asins_by_status']['fresh']}")
    logger.info(f"  - Stale (≥30 days): {metadata['asins_by_status']['stale']}")
    logger.info(f"Last full refresh: {metadata['last_full_refresh']}")
    logger.info(f"Next full refresh: {metadata['next_full_refresh']}")
    logger.info("=" * 60)


def convert_latest_stage2_data():
    """
    Find and convert the latest Stage 2 data files
    """
    logger.info("Finding latest Stage 2 data files...")

    # Find latest products file
    products_files = sorted(glob(str(DATA_DIR / "products_*.json")), reverse=True)
    if not products_files:
        logger.error("No products files found!")
        return

    # Exclude progress files, get timestamped ones
    products_files = [f for f in products_files if "progress" not in f]
    if not products_files:
        logger.error("No timestamped products files found!")
        return

    products_file = products_files[0]
    logger.info(f"  Latest products: {Path(products_file).name}")

    # Find matching reviews file
    timestamp = Path(products_file).stem.replace("products_", "")
    reviews_file = DATA_DIR / f"reviews_{timestamp}.json"

    if not reviews_file.exists():
        logger.error(f"Matching reviews file not found: {reviews_file}")
        return

    logger.info(f"  Latest reviews: {reviews_file.name}")

    # Convert
    convert_to_master_db(str(products_file), str(reviews_file))


if __name__ == "__main__":
    import sys

    if len(sys.argv) == 3:
        # Manual file specification
        products_file = sys.argv[1]
        reviews_file = sys.argv[2]
        convert_to_master_db(products_file, reviews_file)
    else:
        # Auto-detect latest files
        convert_latest_stage2_data()
