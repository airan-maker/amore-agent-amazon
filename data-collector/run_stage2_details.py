"""
Stage 2: Collect product details and reviews (slow, with long delays)
Reads rankings from Stage 1 and enriches with detailed information
"""
import asyncio
import yaml
import json
import random
from pathlib import Path
from loguru import logger
from datetime import datetime
from glob import glob

from config.settings import CONFIG_DIR, OUTPUT_DIR, DATA_DIR
from scrapers.product_scraper import ProductScraper
from scrapers.review_scraper import ReviewScraper


async def collect_product_details():
    """Collect detailed product information and reviews with long delays"""

    logger.info("=" * 60)
    logger.info("STAGE 2: Collecting Product Details (Slow & Safe)")
    logger.info("=" * 60)

    # Find latest rankings file from Stage 1
    rankings_files = sorted(glob(str(OUTPUT_DIR / "rankings_only_*.json")), reverse=True)
    if not rankings_files:
        logger.error("No rankings file found. Run run_stage1_rankings.py first!")
        return

    rankings_file = rankings_files[0]
    logger.info(f"Reading rankings from: {rankings_file}")

    with open(rankings_file, "r", encoding="utf-8") as f:
        collected_ranks = json.load(f)

    # Collect all unique ASINs
    asins_to_scrape = set()
    for category_name, rankings in collected_ranks.items():
        for product in rankings:
            if product.get("asin"):
                asins_to_scrape.add(product["asin"])

    total_asins = len(asins_to_scrape)
    logger.info(f"Found {total_asins} unique products to scrape")

    # Load config for max reviews
    with open(CONFIG_DIR / "products.yaml", "r", encoding="utf-8") as f:
        products_config = yaml.safe_load(f)
    max_reviews = products_config["collection_settings"]["reviews_per_product"]

    # Storage for collected data
    collected_products = {}
    collected_reviews = {}

    # Progress tracking
    enriched_count = 0
    failed_count = 0
    skipped_count = 0

    async with ProductScraper() as product_scraper, ReviewScraper() as review_scraper:
        for idx, asin in enumerate(asins_to_scrape, 1):
            logger.info(f"\n[{idx}/{total_asins}] Processing: {asin}")

            # Random delay between products (10-30 seconds) to avoid detection
            if idx > 1:
                delay = random.randint(10, 30)
                logger.info(f"  Waiting {delay}s before next product...")
                await asyncio.sleep(delay)

            try:
                # Scrape product details
                logger.info(f"  Scraping product details...")
                product_data = await product_scraper.scrape(asin)
                collected_products[asin] = product_data
                enriched_count += 1

                logger.success(f"  ✓ Product: {product_data.get('product_name', asin)[:60]}")

                # Small delay before scraping reviews
                await asyncio.sleep(random.randint(2, 4))

                # Scrape reviews from product detail page (no separate review page navigation)
                logger.info(f"  Scraping reviews from product page...")
                reviews = await review_scraper.scrape_from_product_page(
                    asin,
                    max_reviews=max_reviews,
                    navigate=True  # Navigate to product page and scroll to reviews
                )

                collected_reviews[asin] = {
                    "reviews": reviews,
                    "count": len(reviews)
                }

                logger.success(f"  ✓ Collected {len(reviews)} reviews")

            except Exception as e:
                logger.error(f"  ✗ Failed to scrape {asin}: {e}")
                failed_count += 1
                collected_products[asin] = {
                    "asin": asin,
                    "error": str(e),
                    "scraped_at": datetime.now().isoformat()
                }

            # Save progress every 20 products
            if idx % 20 == 0:
                logger.info(f"\n💾 Saving progress... ({enriched_count} enriched, {failed_count} failed)")
                _save_progress(collected_products, collected_reviews, "progress")

    # Final save
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    _save_progress(collected_products, collected_reviews, timestamp)

    # Summary
    logger.success("\n" + "=" * 60)
    logger.success(f"STAGE 2 COMPLETE")
    logger.success(f"  Total products: {total_asins}")
    logger.success(f"  ✓ Enriched: {enriched_count}")
    logger.success(f"  ✗ Failed: {failed_count}")
    if enriched_count > 0:
        logger.success(f"  Success rate: {(enriched_count / total_asins * 100):.1f}%")
    logger.success("=" * 60)


def _save_progress(products, reviews, label):
    """Save collected data to files"""

    # Save products
    products_file = DATA_DIR / f"products_{label}.json"
    with open(products_file, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    logger.info(f"  Saved products: {products_file}")

    # Save reviews
    reviews_file = DATA_DIR / f"reviews_{label}.json"
    with open(reviews_file, "w", encoding="utf-8") as f:
        json.dump(reviews, f, indent=2, ensure_ascii=False)
    logger.info(f"  Saved reviews: {reviews_file}")


if __name__ == "__main__":
    logger.info("⚠️ This script uses long delays (10-30s) between products to avoid bot detection")
    logger.info(f"⏱️ Estimated time: 2-10 hours depending on number of products\n")

    user_input = input("Continue? (yes/no): ")
    if user_input.lower() in ["yes", "y"]:
        asyncio.run(collect_product_details())
    else:
        logger.info("Cancelled")
