"""
Best Sellers rank scraper
Collects product rankings from Amazon Best Sellers pages
"""
import re
from typing import Dict, List, Any, Optional
from loguru import logger
from datetime import datetime

from scrapers.base_scraper import BaseScraper


class RankScraper(BaseScraper):
    """
    Scrapes Best Sellers rankings from Amazon

    Collects:
    - Product ASIN
    - Rank position
    - Category
    - Product name
    - Brand (if available)
    - Price
    - Rating
    """

    async def scrape(self, category_url: str, max_rank: int = 100, use_scroll: bool = True, use_hybrid: bool = True) -> List[Dict[str, Any]]:
        """
        Scrape Best Sellers for a category

        Args:
            category_url: Best Sellers page URL
            max_rank: Maximum rank to collect (default 100)
            use_scroll: Use scroll method for dynamic loading (default True)
            use_hybrid: Use hybrid method (pagination + scroll per page) (default True)

        Returns:
            list: Product rankings
        """
        logger.info(f"Scraping Best Sellers from: {category_url}")
        logger.info(f"Target: {max_rank} products")

        if use_hybrid:
            return await self._scrape_with_hybrid(category_url, max_rank)
        elif use_scroll:
            return await self._scrape_with_scroll(category_url, max_rank)
        else:
            return await self._scrape_with_pagination(category_url, max_rank)

    async def _scrape_with_scroll(self, category_url: str, max_rank: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape using scroll method for dynamically loaded products
        Optimized to collect all 100 products by aggressive scrolling

        Args:
            category_url: Best Sellers page URL
            max_rank: Maximum rank to collect

        Returns:
            list: Product rankings
        """
        logger.info(f"Using scroll method to load products...")
        logger.info(f"Target: {max_rank} products (will scroll aggressively)")

        # Navigate to the page
        success = await self.goto(category_url)
        if not success:
            logger.error("Failed to load category page")
            return []

        # Wait for initial products to load (longer timeout for slow pages)
        logger.info("Waiting for products to load (up to 30 seconds)...")
        await self.wait_for_selector(".zg-grid-general-faceout", timeout=30000)

        # Additional wait for dynamic content to fully render
        logger.info("Waiting for dynamic content to render...")
        await self.random_delay(3, 5)

        rankings = []
        previous_count = 0
        no_change_count = 0
        max_scrolls = 30  # Increased from 10 to 30 for 100 products

        for scroll_attempt in range(max_scrolls):
            # Extract currently visible products
            current_products = await self._extract_products_from_page()

            # Update rankings with new products (avoid duplicates)
            for product in current_products:
                if product and product.get("asin"):
                    # Check if ASIN already exists
                    if not any(p.get("asin") == product["asin"] for p in rankings):
                        rankings.append(product)

            logger.info(f"Scroll {scroll_attempt + 1}/{max_scrolls}: Total unique products = {len(rankings)}/{max_rank}")

            # Check if we've collected enough
            if len(rankings) >= max_rank:
                logger.success(f"✅ Reached target of {max_rank} products!")
                break

            # Check if new products were loaded
            if len(rankings) == previous_count:
                no_change_count += 1
                if no_change_count >= 5:  # Increased from 3 to 5
                    logger.warning(f"No new products loaded after 5 scroll attempts")
                    logger.info(f"Trying more aggressive scrolling...")
                    # Try scrolling to bottom
                    await self._scroll_to_bottom()
                    await self.random_delay(4, 6)

                    # One more attempt
                    current_products = await self._extract_products_from_page()
                    for product in current_products:
                        if product and product.get("asin"):
                            if not any(p.get("asin") == product["asin"] for p in rankings):
                                rankings.append(product)

                    if len(rankings) == previous_count:
                        logger.warning(f"Still no new products. Stopping at {len(rankings)} products")
                        break
                    else:
                        no_change_count = 0
            else:
                no_change_count = 0

            previous_count = len(rankings)

            # Multiple scroll strategies
            if scroll_attempt % 3 == 0:
                # Every 3rd scroll: scroll to bottom
                await self._scroll_to_bottom()
            else:
                # Regular scroll
                await self._scroll_page()

            # Wait for products to load after scroll
            await self.random_delay(2, 4)

        # Limit to max_rank
        rankings = rankings[:max_rank]

        # Assign ranks based on position if not already present
        for idx, product in enumerate(rankings, start=1):
            if product.get("rank") is None:
                product["rank"] = idx

        logger.success(f"✅ Total products collected with scroll: {len(rankings)}/{max_rank}")

        if len(rankings) < max_rank:
            logger.warning(f"⚠️ Only collected {len(rankings)}/{max_rank} products. Page may have fewer items.")

        return rankings

    async def _scrape_with_hybrid(self, category_url: str, max_rank: int = 100) -> List[Dict[str, Any]]:
        """
        Hybrid scraping: Pagination + Dynamic Scrolling
        Best of both worlds - navigate pages AND scroll within each page

        Includes retry logic for page 2+ failures to ensure 100 product collection

        Args:
            category_url: Best Sellers page URL
            max_rank: Maximum rank to collect (default 100)

        Returns:
            list: Product rankings
        """
        import asyncio

        logger.info(f"🔥 Using HYBRID method (Pagination + Scroll)")
        logger.info(f"Will navigate pages AND scroll within each page for maximum coverage")

        all_rankings = []
        page = 1
        max_page = (max_rank + 49) // 50  # Estimate pages needed
        max_retries_per_page = 3  # Maximum retries for each page
        base_retry_delay = 10  # Base delay in seconds for retries

        logger.info(f"Planning to scrape {max_page} page(s)")

        while page <= max_page and len(all_rankings) < max_rank:
            # Build page URL
            if page == 1:
                url = category_url
            else:
                # Try different URL formats for page 2+
                separator = "&" if "?" in category_url else "?"
                url = f"{category_url}{separator}pg={page}"

            logger.info(f"\n{'='*60}")
            logger.info(f"📄 PAGE {page}/{max_page}")
            logger.info(f"{'='*60}")

            # Retry loop for this page
            page_success = False
            page_products = []

            for retry in range(max_retries_per_page):
                if retry > 0:
                    retry_delay = base_retry_delay * (2 ** (retry - 1))  # Exponential backoff
                    logger.warning(f"🔄 Retry {retry}/{max_retries_per_page} for page {page} (waiting {retry_delay}s)")
                    await asyncio.sleep(retry_delay)

                    # On retry, try alternative URL format for page 2+
                    if page > 1 and retry == 1:
                        # Try with trailing slash
                        base_url = category_url.rstrip('/')
                        url = f"{base_url}/?pg={page}"
                        logger.info(f"Trying alternative URL format: {url}")
                    elif page > 1 and retry == 2:
                        # Try ref parameter format (Amazon sometimes uses this)
                        base_url = category_url.rstrip('/')
                        url = f"{base_url}/ref=zg_bs_pg_{page}?pg={page}"
                        logger.info(f"Trying ref URL format: {url}")

                # Navigate to page
                success = await self.goto(url)
                if not success:
                    logger.error(f"Failed to load page {page} (attempt {retry + 1}/{max_retries_per_page})")
                    continue  # Retry instead of break

                # Wait for products to load
                logger.info("Waiting for products to load...")
                found = await self.wait_for_selector(".zg-grid-general-faceout", timeout=30000)
                if not found:
                    # Try alternative selectors
                    logger.warning(f"Primary selector not found, trying alternatives...")
                    alt_selectors = [
                        "[data-component-type='s-search-result']",
                        ".s-result-item",
                        "#gridItemRoot"
                    ]
                    for alt_sel in alt_selectors:
                        found = await self.wait_for_selector(alt_sel, timeout=10000)
                        if found:
                            logger.info(f"Found products with alternative selector: {alt_sel}")
                            break

                    if not found:
                        logger.warning(f"Product grid not found on page {page} (attempt {retry + 1}/{max_retries_per_page})")
                        continue  # Retry instead of break

                await self.random_delay(3, 5)

                # Scroll within this page to load all dynamic content
                page_products = await self._scroll_within_page(max_products=60)

                if not page_products:
                    logger.warning(f"No products found on page {page} (attempt {retry + 1}/{max_retries_per_page})")
                    continue  # Retry instead of break

                # Success! Exit retry loop
                page_success = True
                break

            # If all retries failed for this page
            if not page_success:
                if page == 1:
                    # If page 1 fails completely, we can't continue
                    logger.error(f"❌ Page 1 failed after {max_retries_per_page} retries. Aborting.")
                    break
                else:
                    # For page 2+, log warning but continue with what we have
                    logger.warning(f"⚠️ Page {page} failed after {max_retries_per_page} retries. Continuing with {len(all_rankings)} products.")
                    break

            # Add products from this page
            for product in page_products:
                if product and product.get("asin"):
                    # Check if ASIN already exists
                    if not any(p.get("asin") == product["asin"] for p in all_rankings):
                        all_rankings.append(product)

            logger.success(f"✅ Page {page}: Collected {len(page_products)} products (Total: {len(all_rankings)})")

            # Check if we have enough
            if len(all_rankings) >= max_rank:
                logger.success(f"🎯 Reached target of {max_rank} products!")
                break

            # Move to next page
            page += 1

            # Delay between pages (longer delay to avoid rate limiting)
            if page <= max_page:
                logger.info("⏳ Waiting before next page...")
                await self.random_delay(5, 8)  # Increased delay between pages

        # Limit to max_rank
        all_rankings = all_rankings[:max_rank]

        # Assign ranks based on position if not already present
        # This ensures we have valid ranks even if scraping failed to extract them
        for idx, product in enumerate(all_rankings, start=1):
            if product.get("rank") is None:
                product["rank"] = idx

        logger.success(f"{'='*60}")
        logger.success(f"✅ HYBRID SCRAPING COMPLETE")
        logger.success(f"📊 Total: {len(all_rankings)}/{max_rank} products")
        logger.success(f"📄 Pages scraped: {page}")
        if len(all_rankings) < max_rank:
            logger.warning(f"⚠️ Only collected {len(all_rankings)}/{max_rank} products")
        logger.success(f"{'='*60}")

        return all_rankings

    async def _scroll_within_page(self, max_products: int = 60) -> List[Dict[str, Any]]:
        """
        Scroll within a single page to load all dynamic content

        Args:
            max_products: Maximum products to collect from this page

        Returns:
            list: Products from this page
        """
        logger.info(f"🔄 Scrolling within page to load dynamic content...")

        rankings = []
        previous_count = 0
        no_change_count = 0
        max_scrolls = 15  # Enough for one page

        for scroll_attempt in range(max_scrolls):
            # Extract currently visible products
            current_products = await self._extract_products_from_page()

            # Update rankings with new products (avoid duplicates)
            for product in current_products:
                if product and product.get("asin"):
                    if not any(p.get("asin") == product["asin"] for p in rankings):
                        rankings.append(product)

            logger.debug(f"  Scroll {scroll_attempt + 1}: {len(rankings)} products")

            # Check if we've collected enough for this page
            if len(rankings) >= max_products:
                logger.info(f"  ✓ Page limit reached: {len(rankings)} products")
                break

            # Check if new products were loaded
            if len(rankings) == previous_count:
                no_change_count += 1
                if no_change_count >= 3:
                    logger.info(f"  ✓ No new products after 3 scrolls, page complete")
                    break
            else:
                no_change_count = 0

            previous_count = len(rankings)

            # Scroll strategies
            if scroll_attempt % 4 == 0:
                await self._scroll_to_bottom()
            else:
                await self._scroll_page()

            await self.random_delay(1.5, 2.5)

        logger.info(f"✓ Page scroll complete: {len(rankings)} products collected")
        return rankings

    async def _scrape_with_pagination(self, category_url: str, max_rank: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape using pagination method
        Amazon Best Sellers: Page 1 = Rank 1-50, Page 2 = Rank 51-100

        Args:
            category_url: Best Sellers page URL
            max_rank: Maximum rank to collect (default 100)

        Returns:
            list: Product rankings
        """
        logger.info(f"Using pagination method to collect up to {max_rank} products...")

        rankings = []
        page = 1
        # Calculate how many pages needed (Amazon shows 50 items per page)
        max_page = (max_rank + 49) // 50  # Ceiling division

        logger.info(f"Will scrape {max_page} page(s) to collect {max_rank} products")

        while page <= max_page and len(rankings) < max_rank:
            # Build page URL
            if page == 1:
                url = category_url
            else:
                # Add page parameter
                separator = "&" if "?" in category_url else "?"
                url = f"{category_url}{separator}pg={page}"

            logger.info(f"\n--- Page {page}/{max_page} ---")
            success = await self.goto(url)

            if not success:
                logger.error(f"Failed to load page {page}")
                break

            # Wait for product grid (longer timeout for slow pages)
            logger.info("Waiting for products to load...")
            found = await self.wait_for_selector(".zg-grid-general-faceout", timeout=30000)

            if not found:
                logger.warning(f"Product grid not found on page {page}")
                break

            # Additional wait for dynamic content
            await self.random_delay(2, 3)

            # Extract products from current page
            page_products = await self._extract_products_from_page()

            if not page_products:
                logger.warning(f"No products found on page {page}")
                break

            # Add to rankings
            rankings.extend(page_products)
            logger.success(f"✓ Page {page}: Collected {len(page_products)} products (Total: {len(rankings)})")

            # Check if we have enough
            if len(rankings) >= max_rank:
                logger.info(f"Reached target of {max_rank} products")
                break

            page += 1

            # Small delay between pages
            if page <= max_page:
                logger.info("Waiting before next page...")
                await self.random_delay(2, 3)

        # Limit to max_rank
        rankings = rankings[:max_rank]

        # Assign ranks based on position if not already present
        for idx, product in enumerate(rankings, start=1):
            if product.get("rank") is None:
                product["rank"] = idx

        logger.success(f"✅ Total products collected: {len(rankings)}/{max_rank}")
        return rankings

    async def _scroll_page(self):
        """Scroll down the page to trigger dynamic loading"""
        try:
            await self.page.evaluate("""
                () => {
                    window.scrollBy(0, window.innerHeight * 0.8);
                }
            """)
            logger.debug("Scrolled down page (80% viewport)")
        except Exception as e:
            logger.warning(f"Scroll failed: {e}")

    async def _scroll_to_bottom(self):
        """Scroll to the absolute bottom of the page"""
        try:
            await self.page.evaluate("""
                () => {
                    window.scrollTo(0, document.body.scrollHeight);
                }
            """)
            logger.debug("Scrolled to bottom of page")
        except Exception as e:
            logger.warning(f"Scroll to bottom failed: {e}")

    async def _extract_products_from_page(self) -> List[Dict[str, Any]]:
        """Extract all products from current Best Sellers page"""
        products = []

        # Get all product containers
        product_elements = await self.page.query_selector_all(
            ".zg-grid-general-faceout"
        )

        for element in product_elements:
            try:
                product_data = await self._extract_product_data(element)
                if product_data and product_data.get("asin"):
                    products.append(product_data)
            except Exception as e:
                logger.debug(f"Failed to extract product: {e}")
                continue

        return products

    async def _extract_product_data(self, element) -> Optional[Dict[str, Any]]:
        """Extract data from a single product element"""
        try:
            # Rank - try multiple selectors
            rank = None
            # Try selector 1: .zg-bdg-text (old format)
            rank_element = await element.query_selector(".zg-bdg-text")
            if not rank_element:
                # Try selector 2: span with rank badge
                rank_element = await element.query_selector("span.zg-badge-text")
            if not rank_element:
                # Try selector 3: any element with rank text
                rank_element = await element.query_selector("[aria-label*='#']")

            rank_text = await rank_element.text_content() if rank_element else None
            if rank_text:
                match = re.search(r"#?(\d+)", rank_text)
                if match:
                    rank = int(match.group(1))

            # ASIN (from link)
            link_element = await element.query_selector("a.a-link-normal")
            asin = None
            product_url = None
            if link_element:
                href = await link_element.get_attribute("href")
                if href:
                    product_url = href
                    # Extract ASIN from URL
                    match = re.search(r"/dp/([A-Z0-9]{10})", href)
                    if match:
                        asin = match.group(1)

            if not asin:
                return None

            # Product name
            title_element = await element.query_selector("div._cDEzb_p13n-sc-css-line-clamp-3_g3dy1")
            if not title_element:
                title_element = await element.query_selector("a.a-link-normal > div")
            product_name = await title_element.text_content() if title_element else None
            if product_name:
                product_name = product_name.strip()

            # Price
            price_element = await element.query_selector(".a-price .a-offscreen")
            price_text = await price_element.text_content() if price_element else None
            price = None
            if price_text:
                match = re.search(r"\$?([\d,]+\.?\d*)", price_text)
                if match:
                    price = float(match.group(1).replace(",", ""))

            # Rating
            rating_element = await element.query_selector(".a-icon-alt")
            rating_text = await rating_element.text_content() if rating_element else None
            rating = None
            if rating_text:
                match = re.search(r"([\d.]+)\s*out of\s*5", rating_text)
                if match:
                    rating = float(match.group(1))

            # Review count
            review_element = await element.query_selector("span.a-size-small")
            review_text = await review_element.text_content() if review_element else None
            review_count = None
            if review_text:
                match = re.search(r"([\d,]+)", review_text)
                if match:
                    review_count = int(match.group(1).replace(",", ""))

            return {
                "rank": rank,
                "asin": asin,
                "product_name": product_name,
                "price": price,
                "rating": rating,
                "review_count": review_count,
                "product_url": product_url,
                "scraped_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.debug(f"Error extracting product data: {e}")
            return None

    async def scrape_product_rank_in_category(
        self,
        asin: str,
        category_url: str,
        max_rank: int = 100
    ) -> Optional[int]:
        """
        Find specific product's rank in a category

        Args:
            asin: Product ASIN to find
            category_url: Category Best Sellers URL
            max_rank: Maximum rank to search

        Returns:
            int: Rank position, or None if not found
        """
        logger.info(f"Searching for {asin} in category rankings")

        rankings = await self.scrape(category_url, max_rank)

        for product in rankings:
            if product.get("asin") == asin:
                rank = product.get("rank")
                logger.success(f"Found {asin} at rank #{rank}")
                return rank

        logger.warning(f"Product {asin} not found in top {max_rank}")
        return None

    async def scrape_multiple_categories(
        self,
        category_urls: Dict[str, str],
        asin: str
    ) -> Dict[str, Optional[int]]:
        """
        Check product rank across multiple categories

        Args:
            category_urls: Dict of {category_name: category_url}
            asin: Product ASIN

        Returns:
            dict: {category_name: rank or None}
        """
        results = {}

        for category_name, category_url in category_urls.items():
            logger.info(f"Checking {asin} in {category_name}")
            rank = await self.scrape_product_rank_in_category(asin, category_url)
            results[category_name] = rank

        return results


# Example usage
async def main():
    """Test the rank scraper"""
    from loguru import logger
    logger.add("logs/rank_scraper_test.log", rotation="10 MB")

    category_url = "https://www.amazon.com/Best-Sellers-Beauty-Facial-Moisturizers/zgbs/beauty/11060451"

    async with RankScraper() as scraper:
        # Get top 20 products
        rankings = await scraper.scrape(category_url, max_rank=20)

        for product in rankings:
            logger.info(
                f"Rank #{product['rank']}: {product['product_name']} "
                f"(ASIN: {product['asin']}, Price: ${product['price']}, "
                f"Rating: {product['rating']})"
            )


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
