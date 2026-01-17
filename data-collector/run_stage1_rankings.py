"""
Stage 1: Collect rankings only (fast)
Collects product lists from category pages without detailed scraping
"""
import asyncio
import yaml
import json
from pathlib import Path
from loguru import logger
from datetime import datetime

from config.settings import CONFIG_DIR, OUTPUT_DIR
from scrapers.rank_scraper import RankScraper


async def collect_rankings_only():
    """Collect only rankings (ASIN, title, price, rating) - no details"""

    logger.info("=" * 60)
    logger.info("STAGE 1: Collecting Rankings Only (Fast)")
    logger.info("=" * 60)

    # Load categories config
    config_path = CONFIG_DIR / "categories.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        categories_config = yaml.safe_load(f)

    collected_ranks = {}

    async with RankScraper() as scraper:
        # Primary category
        primary_cat = categories_config["primary_category"]
        logger.info(f"\nScraping primary category: {primary_cat['name']}")

        try:
            rankings = await scraper.scrape(
                primary_cat["best_sellers_url"],
                max_rank=primary_cat["track_top_n"],
                use_hybrid=True
            )
            collected_ranks[primary_cat["name"]] = rankings
            logger.success(f"✓ Collected {len(rankings)} products from {primary_cat['name']}")
        except Exception as e:
            logger.error(f"✗ Failed to scrape {primary_cat['name']}: {e}")

        # Related categories
        for category in categories_config["related_categories"]:
            if not category.get("track_enabled", False):
                continue

            logger.info(f"\nScraping related category: {category['name']}")

            try:
                max_rank = category.get("track_top_n", 100)
                rankings = await scraper.scrape(
                    category["best_sellers_url"],
                    max_rank=max_rank,
                    use_hybrid=True
                )
                collected_ranks[category["name"]] = rankings
                logger.success(f"✓ Collected {len(rankings)} products from {category['name']}")
            except Exception as e:
                logger.error(f"✗ Failed to scrape {category['name']}: {e}")

    # Save rankings
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Save as rankings_only file (for stage 2 to read)
    rankings_file = OUTPUT_DIR / f"rankings_only_{timestamp}.json"
    with open(rankings_file, "w", encoding="utf-8") as f:
        json.dump(collected_ranks, f, indent=2, ensure_ascii=False)
    logger.info(f"\n✓ Saved rankings to: {rankings_file}")

    # Also save as test_5_categories format for frontend
    category_products = {}
    for category_name, rankings in collected_ranks.items():
        category_products[category_name] = {
            "category": category_name,
            "success": True,
            "products_count": len(rankings),
            "products": rankings
        }

    category_file = OUTPUT_DIR / f"test_5_categories_{timestamp}.json"
    with open(category_file, "w", encoding="utf-8") as f:
        json.dump(category_products, f, indent=2, ensure_ascii=False)
    logger.info(f"✓ Saved category products to: {category_file}")

    # Summary
    total_products = sum(len(ranks) for ranks in collected_ranks.values())
    logger.success("\n" + "=" * 60)
    logger.success(f"STAGE 1 COMPLETE")
    logger.success(f"  Categories: {len(collected_ranks)}")
    logger.success(f"  Total products: {total_products}")
    logger.success("=" * 60)
    logger.info("\n💡 Next Step:")
    logger.info("  Wait a few hours, then run: python run_stage2_details.py")


if __name__ == "__main__":
    asyncio.run(collect_rankings_only())
