"""
Test scraper for Beauty & Personal Care category
"""
import asyncio
from playwright.async_api import async_playwright

async def test_beauty_scraper():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        # Navigate to Beauty & Personal Care Best Sellers
        url = "https://www.amazon.com/Best-Sellers-Beauty-Personal-Care/zgbs/beauty/ref=zg_bs_unv_beauty_1_120225719011_2"
        print(f"Navigating to: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)

        # Wait for page to load
        await page.wait_for_timeout(5000)

        # Check for product containers
        print("\nChecking for product containers...")

        # Try different selectors
        selectors = [
            ".zg-grid-general-faceout",
            "[data-testid='product-card']",
            ".p13n-sc-uncoverable-faceout",
            "#gridItemRoot",
            "[data-asin]"
        ]

        for selector in selectors:
            elements = await page.query_selector_all(selector)
            print(f"  {selector}: {len(elements)} elements found")

            if elements:
                print(f"\n  First element HTML (truncated):")
                html = await elements[0].inner_html()
                print(f"    {html[:500]}...")

                # Try to extract ASIN
                print(f"\n  Trying to extract ASIN...")
                link = await elements[0].query_selector("a[href*='/dp/']")
                if link:
                    href = await link.get_attribute("href")
                    print(f"    Found link: {href}")
                else:
                    print(f"    No link found")

        # Keep browser open for manual inspection
        print("\n\nBrowser will stay open for 30 seconds for manual inspection...")
        await page.wait_for_timeout(30000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_beauty_scraper())
