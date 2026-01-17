"""
Quick test script to verify scrapers work with real ASINs
Tests one product at a time for fast validation
"""
import asyncio
import json
from loguru import logger

from scrapers.product_scraper import ProductScraper
from scrapers.review_scraper import ReviewScraper
from scrapers.rank_scraper import RankScraper

# Setup logging
logger.add("logs/test_{time}.log", rotation="1 MB")


async def test_product_scraper():
    """Test product detail scraping"""
    logger.info("="*60)
    logger.info("Testing Product Scraper")
    logger.info("="*60)

    # Test with LANEIGE Water Sleeping Mask
    test_asin = "B09HN8JBFP"

    async with ProductScraper() as scraper:
        logger.info(f"Scraping product: {test_asin}")
        product_data = await scraper.scrape(test_asin)

        # Print results
        logger.info("\n📦 Product Data:")
        logger.info(f"  Brand: {product_data.get('brand')}")
        logger.info(f"  Name: {product_data.get('product_name')}")
        logger.info(f"  Price: ${product_data.get('price', {}).get('current_price')}")
        logger.info(f"  Rating: {product_data.get('rating')}/5")
        logger.info(f"  Reviews: {product_data.get('review_count')}")
        logger.info(f"  Category: {product_data.get('category')}")
        logger.info(f"  Breadcrumb: {product_data.get('breadcrumb')}")

        # Save to file
        with open("data/test_product.json", "w", encoding="utf-8") as f:
            json.dump(product_data, f, indent=2, ensure_ascii=False)

        logger.success("✓ Product scraper test passed!")
        return product_data


async def test_review_scraper():
    """Test review scraping"""
    logger.info("\n" + "="*60)
    logger.info("Testing Review Scraper")
    logger.info("="*60)

    # Test with LANEIGE Water Sleeping Mask
    test_asin = "B09HN8JBFP"

    async with ReviewScraper() as scraper:
        logger.info(f"Scraping reviews for: {test_asin}")

        # Get review summary first
        summary = await scraper.scrape_review_summary(test_asin)
        logger.info(f"\n📊 Review Summary:")
        logger.info(f"  Total Reviews: {summary.get('total_reviews')}")
        logger.info(f"  Average Rating: {summary.get('average_rating')}/5")
        logger.info(f"  Rating Breakdown: {summary.get('rating_breakdown')}")

        # Get first 10 reviews for quick test
        reviews = await scraper.scrape(test_asin, max_reviews=10)

        logger.info(f"\n💬 Sample Reviews: (showing 3/{len(reviews)})")
        for i, review in enumerate(reviews[:3], 1):
            logger.info(f"\n  Review {i}:")
            logger.info(f"    Rating: {'⭐' * review['rating']}")
            logger.info(f"    Title: {review['title']}")
            logger.info(f"    Text: {review['text'][:100]}...")
            logger.info(f"    Verified: {'✓' if review['verified'] else '✗'}")
            logger.info(f"    Helpful votes: {review['helpful_votes']}")

        # Save to file
        with open("data/test_reviews.json", "w", encoding="utf-8") as f:
            json.dump({"summary": summary, "reviews": reviews}, f, indent=2, ensure_ascii=False)

        logger.success(f"✓ Review scraper test passed! Collected {len(reviews)} reviews")
        return reviews


async def test_rank_scraper():
    """Test rank scraping"""
    logger.info("\n" + "="*60)
    logger.info("Testing Rank Scraper")
    logger.info("="*60)

    # Test with Face Moisturizers category
    category_url = "https://www.amazon.com/Best-Sellers-Beauty-Facial-Moisturizers/zgbs/beauty/11060451"

    async with RankScraper() as scraper:
        logger.info("Scraping Best Sellers rankings (Top 20)")

        rankings = await scraper.scrape(category_url, max_rank=20)

        logger.info(f"\n🏆 Top 10 Products in Face Moisturizers:")
        for product in rankings[:10]:
            logger.info(
                f"  #{product['rank']}: {product['product_name'][:50]}... "
                f"(${product['price']}, ⭐{product['rating']})"
            )

        # Check if our test product is in top 100
        test_asin = "B09HN8JBFP"
        rank = await scraper.scrape_product_rank_in_category(test_asin, category_url, max_rank=100)

        if rank:
            logger.success(f"\n✓ Found LANEIGE Water Sleeping Mask at rank #{rank}")
        else:
            logger.warning(f"\n⚠ LANEIGE Water Sleeping Mask not in Top 100")

        # Save to file
        with open("data/test_rankings.json", "w", encoding="utf-8") as f:
            json.dump(rankings, f, indent=2, ensure_ascii=False)

        logger.success(f"✓ Rank scraper test passed! Collected {len(rankings)} rankings")
        return rankings


async def run_all_tests():
    """Run all scraper tests"""
    logger.info("\n" + "🧪 "*20)
    logger.info("RUNNING ALL SCRAPER TESTS")
    logger.info("🧪 "*20 + "\n")

    try:
        # Test 1: Product scraper
        await test_product_scraper()

        # Test 2: Review scraper
        await test_review_scraper()

        # Test 3: Rank scraper
        await test_rank_scraper()

        logger.success("\n" + "="*60)
        logger.success("✅ ALL TESTS PASSED!")
        logger.success("="*60)

        logger.info("\n📁 Test data saved to:")
        logger.info("  - data/test_product.json")
        logger.info("  - data/test_reviews.json")
        logger.info("  - data/test_rankings.json")

    except Exception as e:
        logger.error(f"\n❌ Tests failed: {e}")
        raise


if __name__ == "__main__":
    # Run tests
    asyncio.run(run_all_tests())
