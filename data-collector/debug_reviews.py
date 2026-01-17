"""
Debug script to check what Amazon is showing on review pages
"""
import asyncio
from pathlib import Path
from scrapers.review_scraper import ReviewScraper

async def debug_review_page():
    async with ReviewScraper() as scraper:
        asin = 'B09HN8JBFP'  # LANEIGE Water Sleeping Mask
        url = f"https://www.amazon.com/product-reviews/{asin}"

        print(f"Loading review page: {url}")
        success = await scraper.goto(url)

        if not success:
            print("Failed to load page")
            return

        # Take screenshot
        screenshot_path = Path("debug_review_page.png")
        await scraper.page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"Screenshot saved to: {screenshot_path}")

        # Get page title
        title = await scraper.page.title()
        print(f"Page title: {title}")

        # Check for CAPTCHA
        captcha_selectors = [
            "form[action*='validateCaptcha']",
            "#captchacharacters",
            "img[src*='captcha']",
            ".a-box-inner h4:has-text('Enter the characters')"
        ]

        for selector in captcha_selectors:
            captcha = await scraper.page.query_selector(selector)
            if captcha:
                print(f"[WARNING] CAPTCHA DETECTED: {selector}")
                return

        # Get page content (first 2000 chars)
        content = await scraper.page.content()
        print(f"\nPage content preview (first 2000 chars):")
        print("=" * 60)
        print(content[:2000])
        print("=" * 60)

        # Try to find reviews with various selectors
        print("\n[DEBUG] Testing selectors:")
        test_selectors = [
            "[data-hook='review']",
            "div[id^='customer_review']",
            ".review",
            "[data-hook='review-body']",
            ".a-section.review",
            "div.review",
            "#cm_cr-review_list",
            "[data-hook='review-collapsed']"
        ]

        for selector in test_selectors:
            elements = await scraper.page.query_selector_all(selector)
            print(f"  {selector}: {len(elements)} elements found")

        # Check if there's a "See all reviews" button/link
        see_all = await scraper.page.query_selector("a:has-text('See all reviews')")
        if see_all:
            print("\n[OK] Found 'See all reviews' link")

        # Save full HTML for analysis
        html_path = Path("debug_review_page.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\nFull HTML saved to: {html_path}")

if __name__ == "__main__":
    asyncio.run(debug_review_page())
