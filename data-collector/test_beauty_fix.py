"""
Quick test for Beauty & Personal Care scraping fix
"""
import asyncio
from loguru import logger
from scrapers.rank_scraper import RankScraper

async def test_beauty_category():
    logger.info("Testing Beauty & Personal Care category...")

    # New URL without ref parameter
    url = "https://www.amazon.com/Best-Sellers-Beauty/zgbs/beauty"

    async with RankScraper() as scraper:
        logger.info(f"Scraping: {url}")
        rankings = await scraper.scrape(url, max_rank=20, use_hybrid=True)

        logger.info(f"\n{'='*60}")
        logger.info(f"Results: {len(rankings)} products collected")
        logger.info(f"{'='*60}")

        if rankings:
            logger.success("✅ SUCCESS! Products were collected")
            for i, product in enumerate(rankings[:5], 1):
                logger.info(f"{i}. {product.get('product_name', 'N/A')[:50]}")
                logger.info(f"   ASIN: {product.get('asin', 'N/A')}")
        else:
            logger.error("❌ FAILED! No products collected")

        return len(rankings) > 0

if __name__ == "__main__":
    success = asyncio.run(test_beauty_category())
    exit(0 if success else 1)
