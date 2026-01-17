"""
Generate M1/M2 data from collected rankings, products, and reviews
Uses hybrid target selection (core + dynamic competitors)
"""
import asyncio
import yaml
import json
from pathlib import Path
from loguru import logger
from glob import glob
from datetime import datetime

from config.settings import CONFIG_DIR, OUTPUT_DIR, DATA_DIR
from generators.m1_generator import M1Generator
from generators.m2_generator import M2Generator


def load_all_historical_rankings():
    """Load all historical ranking data for time-series analysis"""
    logger.info("Loading all historical ranking data...")

    # Find all test_5_categories files (sorted by date)
    test_files = sorted(glob(str(OUTPUT_DIR / "test_5_categories_*.json")))

    if not test_files:
        logger.warning("No historical test files found, trying rankings_only files...")
        test_files = sorted(glob(str(OUTPUT_DIR / "rankings_only_*.json")))

    if not test_files:
        logger.warning("No historical files found!")
        return {}

    logger.info(f"  Found {len(test_files)} historical files")

    # Load all files and organize by category
    historical_rankings = {}
    dates = []

    for file_path in test_files:
        filename = Path(file_path).name
        # Extract date from filename (test_5_categories_YYYYMMDD.json)
        try:
            date_str = filename.split("_")[-1].replace(".json", "")
            date_obj = datetime.strptime(date_str, "%Y%m%d")
            dates.append(date_obj.strftime("%Y-%m-%d"))
        except:
            logger.warning(f"  Skipping {filename} - couldn't parse date")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Organize by category
        for category, category_data in data.items():
            if category not in historical_rankings:
                historical_rankings[category] = []

            if "products" in category_data:
                historical_rankings[category].append({
                    "date": date_obj.strftime("%Y-%m-%d"),
                    "products": category_data["products"]
                })

    logger.success(f"  ✓ Loaded {len(test_files)} snapshots from {dates[0]} to {dates[-1]}")
    logger.info(f"  Categories: {list(historical_rankings.keys())}")

    return historical_rankings


def load_latest_data():
    """Load latest collected data"""
    logger.info("Loading latest collected data...")

    # Load rankings from Stage 1
    rankings_files = sorted(glob(str(OUTPUT_DIR / "rankings_only_*.json")), reverse=True)
    if rankings_files:
        rankings_file = rankings_files[0]
    else:
        # Try test data
        rankings_files = sorted(glob(str(OUTPUT_DIR / "test_*.json")), reverse=True)
        if not rankings_files:
            logger.error("No rankings files found!")
            return None, None, None, None
        rankings_file = rankings_files[0]

    logger.info(f"  Latest rankings: {Path(rankings_file).name}")

    with open(rankings_file, "r", encoding="utf-8") as f:
        rankings_data = json.load(f)

    # Load ALL historical rankings for time-series analysis
    historical_rankings = load_all_historical_rankings()

    # Load products from Stage 2 (or master DB)
    master_products = DATA_DIR / "master" / "products_master.json"
    if master_products.exists():
        logger.info("  Loading from master DB: products_master.json")
        from utils.master_db_manager import MasterDBManager
        manager = MasterDBManager()
        manager.load()
        products_data = manager.get_products_dict()
        reviews_data = manager.get_reviews_dict()
    else:
        # Fall back to Stage 2 files
        products_files = sorted(glob(str(DATA_DIR / "products_*.json")), reverse=True)
        products_files = [f for f in products_files if "progress" not in f]
        if not products_files:
            logger.error("No products files found!")
            return None, None, None, None

        products_file = products_files[0]
        timestamp = Path(products_file).stem.replace("products_", "")
        reviews_file = DATA_DIR / f"reviews_{timestamp}.json"

        logger.info(f"  Products: {Path(products_file).name}")
        logger.info(f"  Reviews: {Path(reviews_file).name}")

        with open(products_file, "r", encoding="utf-8") as f:
            products_data = json.load(f)

        with open(reviews_file, "r", encoding="utf-8") as f:
            reviews_data = json.load(f)

    return rankings_data, products_data, reviews_data, historical_rankings


def generate_m1_m2():
    """Generate M1 and M2 data"""
    logger.info("=" * 60)
    logger.info("M1/M2 Data Generation (Hybrid Target Selection)")
    logger.info("=" * 60)

    # Load data (now includes historical rankings)
    rankings_data, products_data, reviews_data, historical_rankings = load_latest_data()

    if not rankings_data or not products_data:
        logger.error("Failed to load required data")
        return

    logger.info(f"\nLoaded:")
    logger.info(f"  Categories: {len(rankings_data)}")
    logger.info(f"  Products: {len(products_data)}")
    logger.info(f"  Review sets: {len(reviews_data)}")
    if historical_rankings:
        num_snapshots = len(historical_rankings.get(list(historical_rankings.keys())[0], []))
        logger.info(f"  Historical snapshots: {num_snapshots}")

    # Initialize generators
    m1_gen = M1Generator()
    m2_gen = M2Generator()

    # ========================================
    # Generate M1 Data
    # ========================================
    logger.info("\n" + "=" * 60)
    logger.info("M1 Module Generation")
    logger.info("=" * 60)

    # M1-1: Breadcrumb Traffic (uses hybrid selection internally)
    m1_breadcrumb = m1_gen.generate_breadcrumb_traffic(products_data, rankings_data)

    # Get selected target ASINs from M1
    target_asins = m1_gen.target_asins
    logger.info(f"\n✓ M1 selected {len(target_asins)} target products for analysis")

    # M1-2: Volatility Index (all categories with time-series data)
    if historical_rankings:
        logger.info(f"\nGenerating M1-2: Volatility Index (time-series analysis)...")
    else:
        logger.info(f"\nGenerating M1-2: Volatility Index (single snapshot)...")
        # Fallback if no historical data
        historical_rankings = {}
        for category, products in rankings_data.items():
            historical_rankings[category] = [{"date": datetime.now().strftime("%Y-%m-%d"), "products": products}]

    categories_config = {}
    m1_volatility = m1_gen.generate_volatility_index(
        historical_rankings,
        categories_config,
        products_data=products_data,
        rankings_data=rankings_data
    )

    # M1-3: Emerging Brands (all brands with time-series data)
    logger.info("\nGenerating M1-3: Emerging Brands (time-series analysis)...")
    m1_emerging = m1_gen.generate_emerging_brands(historical_rankings, min_rank_improvement=5, products_data=products_data)

    # ========================================
    # Generate M2 Data
    # ========================================
    logger.info("\n" + "=" * 60)
    logger.info("M2 Module Generation")
    logger.info("=" * 60)

    # Share target ASINs from M1 to M2
    m2_gen.set_target_asins(target_asins)

    # M2-1: Usage Context
    m2_usage = m2_gen.generate_usage_context(products_data, reviews_data)

    # M2-2: Intelligence Bridge (now with time-series insights)
    m2_intelligence = m2_gen.generate_intelligence_bridge(
        m1_breadcrumb,
        m1_volatility,
        m1_emerging,
        m2_usage,
        historical_rankings  # Pass historical data for trend analysis
    )

    # ========================================
    # Summary
    # ========================================
    logger.info("\n" + "=" * 60)
    logger.success("M1/M2 Generation Complete!")
    logger.info("=" * 60)
    logger.info(f"Target Selection Method: Hybrid (Core + Dynamic)")
    logger.info(f"Total Target Products: {len(target_asins)}")
    if historical_rankings:
        num_snapshots = len(historical_rankings.get(list(historical_rankings.keys())[0], []))
        logger.info(f"Historical Snapshots Used: {num_snapshots}")
    logger.info(f"\nGenerated Files:")
    logger.info(f"  ✓ m1_breadcrumb_traffic.json")
    logger.info(f"  ✓ m1_volatility_index.json")
    logger.info(f"  ✓ m1_emerging_brands.json")
    logger.info(f"  ✓ m2_usage_context.json")
    logger.info(f"  ✓ m2_intelligence_bridge.json")
    logger.info(f"  ✓ target_selection_report.json")
    logger.info("=" * 60)

    logger.info("\nNext steps:")
    logger.info("  1. Run: python utils/data_copier.py")
    logger.info("  2. Check frontend: http://localhost:5173")


if __name__ == "__main__":
    generate_m1_m2()
