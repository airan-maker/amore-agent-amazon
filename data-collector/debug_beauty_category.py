"""
Debug script for Beauty & Personal Care category
Check why it returns 0 products
"""
import asyncio
from loguru import logger
from scrapers.rank_scraper import RankScraper

# Configure detailed logging
logger.add(
    "logs/debug_beauty_{time}.log",
    rotation="10 MB",
    level="DEBUG"  # Use DEBUG level
)

async def debug_beauty_category():
    """Debug the Beauty & Personal Care category"""
    url = "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care/zgbs/beauty/ref=zg_bs_nav_beauty_0"

    logger.info("=" * 80)
    logger.info("DEBUGGING BEAUTY & PERSONAL CARE CATEGORY")
    logger.info("=" * 80)
    logger.info(f"URL: {url}")

    async with RankScraper() as scraper:
        # Navigate to page
        logger.info("\n[Step 1] Navigating to page...")
        success = await scraper.goto(url)

        if not success:
            logger.error("Failed to load page")
            return

        # Wait for products
        logger.info("\n[Step 2] Waiting for products to load...")
        found = await scraper.wait_for_selector(".zg-grid-general-faceout", timeout=15000)
        logger.info(f"Product grid found: {found}")

        # Take screenshot
        logger.info("\n[Step 3] Taking screenshot...")
        await scraper.screenshot("logs/beauty_category_debug.png")
        logger.info("Screenshot saved to: logs/beauty_category_debug.png")

        # Check for alternative selectors
        logger.info("\n[Step 4] Testing alternative selectors...")

        selectors_to_test = [
            ".zg-grid-general-faceout",
            ".zg-item-immersion",
            "div[data-asin]",
            ".a-carousel-card",
            ".p13n-sc-uncoverable-faceout",
        ]

        for selector in selectors_to_test:
            try:
                elements = await scraper.page.query_selector_all(selector)
                logger.info(f"  {selector}: {len(elements)} elements found")
            except Exception as e:
                logger.error(f"  {selector}: Error - {e}")

        # Get page HTML structure
        logger.info("\n[Step 5] Analyzing page structure...")
        try:
            # Check if this is a different type of Best Sellers page
            page_type = await scraper.page.evaluate("""
                () => {
                    const hasCarousel = document.querySelector('.a-carousel-card') !== null;
                    const hasGrid = document.querySelector('.zg-grid-general-faceout') !== null;
                    const hasImmersion = document.querySelector('.zg-item-immersion') !== null;

                    return {
                        hasCarousel: hasCarousel,
                        hasGrid: hasGrid,
                        hasImmersion: hasImmersion,
                        totalDivs: document.querySelectorAll('div').length,
                        bodyClass: document.body.className
                    };
                }
            """)
            logger.info(f"Page structure: {page_type}")
        except Exception as e:
            logger.error(f"Failed to analyze page: {e}")

        # Try to scrape with pagination instead
        logger.info("\n[Step 6] Trying pagination method...")
        products_pagination = await scraper.scrape(
            category_url=url,
            max_rank=10,
            use_scroll=False
        )
        logger.info(f"Pagination result: {len(products_pagination)} products")

        if products_pagination:
            logger.info("\nSample products from pagination:")
            for i, p in enumerate(products_pagination[:3], 1):
                logger.info(f"  {i}. {p.get('product_name', 'N/A')[:60]}")

        # Try scroll method with more attempts
        logger.info("\n[Step 7] Trying scroll method...")
        products_scroll = await scraper.scrape(
            category_url=url,
            max_rank=10,
            use_scroll=True
        )
        logger.info(f"Scroll result: {len(products_scroll)} products")

        if products_scroll:
            logger.info("\nSample products from scroll:")
            for i, p in enumerate(products_scroll[:3], 1):
                logger.info(f"  {i}. {p.get('product_name', 'N/A')[:60]}")

        # Compare URLs with working category
        logger.info("\n[Step 8] Comparing with working category...")
        working_url = "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care-Lip-Care-Products/zgbs/beauty/3761351/ref=zg_bs_nav_beauty_2_11060451"

        logger.info("\nLoading working category for comparison...")
        await scraper.goto(working_url)
        await scraper.wait_for_selector(".zg-grid-general-faceout", timeout=15000)

        working_elements = await scraper.page.query_selector_all(".zg-grid-general-faceout")
        logger.info(f"Working category has {len(working_elements)} product elements")

        logger.info("\n" + "=" * 80)
        logger.info("DEBUG COMPLETE - Check logs/beauty_category_debug.png")
        logger.info("=" * 80)

if __name__ == "__main__":
    asyncio.run(debug_beauty_category())
