"""
Test script for scraping 5 Amazon Beauty categories
Tests the scroll functionality and data collection
"""
import asyncio
import json
from pathlib import Path
from loguru import logger
from datetime import datetime

from scrapers.rank_scraper import RankScraper
from config.settings import OUTPUT_DIR

# Configure logger
logger.add(
    "logs/test_5_categories_{time}.log",
    rotation="10 MB",
    retention="1 week",
    level="INFO"
)

# 5 Target Categories (simplified URLs without ref parameters)
CATEGORIES = {
    "Beauty & Personal Care": "https://www.amazon.com/Best-Sellers-Beauty/zgbs/beauty",
    "Lip Care Products": "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Lip-Care-Products/zgbs/beauty/3761351",
    "Skin Care Products": "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Skin-Care-Products/zgbs/beauty/11060451",
    "Lip Makeup": "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Lip-Makeup/zgbs/beauty/11059031",
    "Face Powder": "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Face-Powder/zgbs/beauty/11058971"
}

async def test_single_category(scraper: RankScraper, category_name: str, url: str, max_products: int = 100):
    """Test scraping a single category"""
    logger.info("=" * 80)
    logger.info(f"Testing category: {category_name}")
    logger.info(f"URL: {url}")
    logger.info(f"Target products: {max_products}")
    logger.info("=" * 80)

    try:
        # Scrape with hybrid method (pagination + scroll)
        products = await scraper.scrape(
            category_url=url,
            max_rank=max_products,
            use_hybrid=True  # Use hybrid: pagination + scroll
        )

        logger.success(f"✓ Successfully scraped {len(products)} products from {category_name}")

        # Display sample products
        logger.info(f"\nSample products from {category_name}:")
        for i, product in enumerate(products[:5], 1):
            logger.info(
                f"  {i}. Rank #{product.get('rank', 'N/A')}: {product.get('product_name', 'N/A')[:60]}... "
                f"(ASIN: {product.get('asin', 'N/A')}, Price: ${product.get('price', 'N/A')})"
            )

        return {
            "category": category_name,
            "url": url,
            "success": True,
            "products_count": len(products),
            "products": products,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"✗ Failed to scrape {category_name}: {e}")
        return {
            "category": category_name,
            "url": url,
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


async def test_all_categories():
    """Test scraping all 5 categories"""
    logger.info("\n" + "=" * 80)
    logger.info("AMAZON 5 CATEGORIES SCRAPING TEST")
    logger.info("=" * 80)

    results = {}

    async with RankScraper() as scraper:
        for category_name, url in CATEGORIES.items():
            result = await test_single_category(
                scraper=scraper,
                category_name=category_name,
                url=url,
                max_products=100  # Collect all 100 products per category
            )
            results[category_name] = result

            # Add delay between categories to avoid rate limiting
            logger.info("\nWaiting before next category...")
            await asyncio.sleep(5)

    # Print summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)

    total_products = 0
    successful_categories = 0

    for category_name, result in results.items():
        if result["success"]:
            successful_categories += 1
            total_products += result["products_count"]
            logger.success(
                f"✓ {category_name}: {result['products_count']} products"
            )
        else:
            logger.error(
                f"✗ {category_name}: FAILED - {result.get('error', 'Unknown error')}"
            )

    logger.info(f"\nSuccessful categories: {successful_categories}/{len(CATEGORIES)}")
    logger.info(f"Total products collected: {total_products}")

    # Save results to JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"test_5_categories_{timestamp}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    logger.success(f"\n✓ Test results saved to: {output_file}")

    return results


async def test_pagination_vs_scroll():
    """Compare pagination vs scroll methods"""
    logger.info("\n" + "=" * 80)
    logger.info("PAGINATION vs SCROLL COMPARISON TEST")
    logger.info("=" * 80)

    test_url = CATEGORIES["Lip Care Products"]
    max_products = 50

    async with RankScraper() as scraper:
        # Test with pagination
        logger.info("\n[1] Testing PAGINATION method...")
        products_pagination = await scraper.scrape(
            category_url=test_url,
            max_rank=max_products,
            use_scroll=False
        )
        logger.info(f"Pagination result: {len(products_pagination)} products")

        await asyncio.sleep(5)  # Delay between tests

        # Test with scroll
        logger.info("\n[2] Testing SCROLL method...")
        products_scroll = await scraper.scrape(
            category_url=test_url,
            max_rank=max_products,
            use_scroll=True
        )
        logger.info(f"Scroll result: {len(products_scroll)} products")

        # Compare results
        logger.info("\n" + "=" * 80)
        logger.info("COMPARISON RESULTS")
        logger.info("=" * 80)
        logger.info(f"Pagination: {len(products_pagination)} products")
        logger.info(f"Scroll: {len(products_scroll)} products")
        logger.info(f"Difference: {abs(len(products_pagination) - len(products_scroll))} products")


async def main():
    """Main test function"""
    import argparse

    parser = argparse.ArgumentParser(description="Test Amazon 5 Categories Scraping")
    parser.add_argument(
        "--mode",
        choices=["all", "compare"],
        default="all",
        help="Test mode: 'all' for all categories, 'compare' for pagination vs scroll"
    )
    args = parser.parse_args()

    try:
        if args.mode == "all":
            await test_all_categories()
        elif args.mode == "compare":
            await test_pagination_vs_scroll()

    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
