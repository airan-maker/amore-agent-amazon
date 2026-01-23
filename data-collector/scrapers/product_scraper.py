"""
Product detail scraper
Collects product information from Amazon product pages
"""
import re
import asyncio
from typing import Dict, Any, Optional
from loguru import logger
from datetime import datetime

from scrapers.base_scraper import BaseScraper
from config.settings import AMAZON_SETTINGS


class ProductScraper(BaseScraper):
    """
    Scrapes product details from Amazon product page

    Collected data:
    - ASIN
    - Brand
    - Product name
    - Price
    - Rating
    - Review count
    - Category breadcrumb
    - Images
    - Product description
    """

    def __init__(self):
        super().__init__()
        self.base_url = AMAZON_SETTINGS["base_url"]

    async def _is_captcha_page(self) -> bool:
        """Check if current page is a CAPTCHA or bot detection page"""
        captcha_indicators = [
            "input[name='captchacharacters']",  # CAPTCHA input
            "form[action*='captcha']",           # CAPTCHA form
            "#captchacharacters",                # CAPTCHA field
            "img[src*='captcha']",               # CAPTCHA image
        ]

        for selector in captcha_indicators:
            if await self.page.query_selector(selector):
                return True

        # Check page title for bot detection
        title = await self.page.title()
        if title and ("robot" in title.lower() or "captcha" in title.lower()):
            return True

        return False

    async def _wait_for_product_page(self) -> bool:
        """Wait for product page to load with combined selector (efficient)"""
        # Combined selector - matches if ANY of these exist (single check, not sequential)
        combined_selector = "#dp-container, #productTitle, #ppd, #centerCol, #dp"

        # Single wait with reasonable timeout (3 seconds total, not 25)
        found = await self.wait_for_selector(combined_selector, timeout=3000)
        if found:
            logger.debug("Product page detected")
            return True

        # Quick check for error/blocked pages (no wait, just query)
        error_indicators = [
            ("img[alt*='dog']", "Dog error page"),
            ("img[alt*='Dogs']", "Dogs of Amazon"),
            ("#unavailable", "Product unavailable"),
            ("form[action*='validateCaptcha']", "CAPTCHA form"),
            (".a-spacing-large.a-text-center", "Blocked page"),
        ]

        for selector, desc in error_indicators:
            if await self.page.query_selector(selector):
                logger.warning(f"Error page detected: {desc}")
                return False

        logger.warning("Could not detect product page structure")
        return False

    async def scrape(self, asin: str) -> Dict[str, Any]:
        """
        Scrape product details for given ASIN

        Args:
            asin: Amazon Standard Identification Number

        Returns:
            dict: Product data
        """
        url = f"{self.base_url}/dp/{asin}"
        logger.info(f"Scraping product: {asin}")

        # Navigate to product page (skip heavy human simulation for speed)
        success = await self.goto(url, simulate_human=False)
        if not success:
            logger.error(f"Failed to load product page: {asin}")
            return {"error": "Failed to load page", "asin": asin}

        # Brief delay to let page settle
        await asyncio.sleep(0.5)

        # Check for CAPTCHA or bot detection pages
        if await self._is_captcha_page():
            logger.warning(f"CAPTCHA detected for {asin}")
            return {"error": "CAPTCHA detected", "asin": asin}

        # Wait for main product container (try multiple selectors)
        container_found = await self._wait_for_product_page()
        if not container_found:
            logger.warning(f"Product page structure not found for {asin}")
            return {"error": "Invalid page structure", "asin": asin}

        # Extract product data
        product_data = {
            "asin": asin,
            "url": url,
            "scraped_at": datetime.now().isoformat(),
            "brand": await self._extract_brand(),
            "product_name": await self._extract_product_name(),
            "price": await self._extract_price(),
            "rating": await self._extract_rating(),
            "review_count": await self._extract_review_count(),
            "breadcrumb": await self._extract_breadcrumb(),
            "category": await self._extract_category(),
            "images": await self._extract_images(),
            "description": await self._extract_description(),
            "features": await self._extract_features(),
            "availability": await self._extract_availability(),
        }

        logger.success(f"Successfully scraped product: {asin} - {product_data['product_name']}")
        return product_data

    async def _extract_brand(self) -> Optional[str]:
        """Extract brand name from 'Visit the X Store' or 'Brand: X' patterns"""
        selectors = [
            "#bylineInfo",
            "a[id='bylineInfo']",
            ".a-row .a-size-small.a-link-normal",
        ]

        for selector in selectors:
            brand_text = await self.extract_text(selector)
            if brand_text:
                brand_text = brand_text.strip()

                # Pattern 1: "Visit the [Brand Name] Store"
                match = re.search(r'Visit\s+the\s+(.+?)\s+Store', brand_text, re.IGNORECASE)
                if match:
                    return match.group(1).strip()

                # Pattern 2: "Brand: [Brand Name]"
                match = re.search(r'Brand:\s*(.+)', brand_text, re.IGNORECASE)
                if match:
                    return match.group(1).strip()

                # Pattern 3: Just the brand name (no prefix/suffix)
                # If no pattern matched but text exists, try cleaning common patterns
                cleaned = brand_text
                cleaned = re.sub(r'^Visit\s+the\s+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\s+Store$', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'^Brand:\s*', '', cleaned, flags=re.IGNORECASE)
                cleaned = cleaned.strip()

                if cleaned and len(cleaned) > 0 and len(cleaned) < 100:
                    return cleaned

        return None

    async def _extract_product_name(self) -> Optional[str]:
        """Extract product name/title"""
        selectors = [
            "#productTitle",
            "h1.a-size-large.product-title-word-break",
        ]

        for selector in selectors:
            name = await self.extract_text(selector)
            if name:
                return name

        return None

    async def _extract_price(self) -> Optional[Dict[str, Any]]:
        """Extract price information"""
        price_data = {}

        # Current price
        price_selectors = [
            ".a-price[data-a-color='price'] .a-offscreen",
            ".a-price .a-offscreen",
            "#priceblock_ourprice",
            "#priceblock_dealprice",
        ]

        for selector in price_selectors:
            price_text = await self.extract_text(selector)
            if price_text:
                # Extract numeric value
                match = re.search(r"\$?([\d,]+\.?\d*)", price_text)
                if match:
                    price_data["current_price"] = float(match.group(1).replace(",", ""))
                    price_data["currency"] = "USD"
                    break

        # List price (if different from current)
        list_price_text = await self.extract_text(".a-price.a-text-price .a-offscreen")
        if list_price_text:
            match = re.search(r"\$?([\d,]+\.?\d*)", list_price_text)
            if match:
                price_data["list_price"] = float(match.group(1).replace(",", ""))

        return price_data if price_data else None

    async def _extract_rating(self) -> Optional[float]:
        """Extract average rating"""
        selectors = [
            "#acrPopover",
            "span[data-hook='rating-out-of-text']",
        ]

        for selector in selectors:
            rating_text = await self.extract_text(selector)
            if rating_text:
                match = re.search(r"([\d.]+)\s*out of\s*5", rating_text)
                if match:
                    return float(match.group(1))

        return None

    async def _extract_review_count(self) -> Optional[int]:
        """Extract total review count"""
        selectors = [
            "#acrCustomerReviewText",
            "span[data-hook='total-review-count']",
        ]

        for selector in selectors:
            count_text = await self.extract_text(selector)
            if count_text:
                match = re.search(r"([\d,]+)", count_text)
                if match:
                    return int(match.group(1).replace(",", ""))

        return None

    async def _extract_breadcrumb(self) -> Optional[str]:
        """Extract category breadcrumb path"""
        breadcrumb_parts = []

        # Try wayfinding breadcrumb (most common)
        breadcrumb_elements = await self.page.query_selector_all(
            "#wayfinding-breadcrumbs_feature_div ul li a"
        )

        if breadcrumb_elements:
            for element in breadcrumb_elements:
                text = await element.text_content()
                if text:
                    breadcrumb_parts.append(text.strip())

        if breadcrumb_parts:
            return " > ".join(breadcrumb_parts)

        return None

    async def _extract_category(self) -> Optional[str]:
        """Extract main category (last item in breadcrumb)"""
        breadcrumb = await self._extract_breadcrumb()
        if breadcrumb:
            parts = breadcrumb.split(" > ")
            return parts[-1] if parts else None
        return None

    async def _extract_images(self) -> list:
        """Extract product image URLs"""
        images = []

        # Main image
        main_image = await self.extract_attribute("#landingImage", "src")
        if main_image:
            # Get high-res version
            main_image = re.sub(r"\._.*?_\.", ".", main_image)
            images.append(main_image)

        # Thumbnail images
        thumb_elements = await self.page.query_selector_all(
            "#altImages ul li img"
        )

        for element in thumb_elements[:5]:  # Limit to 5 images
            src = await element.get_attribute("src")
            if src and src not in images:
                src = re.sub(r"\._.*?_\.", ".", src)
                images.append(src)

        return images

    async def _extract_description(self) -> Optional[str]:
        """Extract product description"""
        selectors = [
            "#productDescription p",
            "#feature-bullets ul li",
        ]

        description_parts = []

        for selector in selectors:
            elements = await self.page.query_selector_all(selector)
            for element in elements:
                text = await element.text_content()
                if text:
                    text = text.strip()
                    if text and len(text) > 10:  # Skip very short texts
                        description_parts.append(text)

            if description_parts:
                break

        if description_parts:
            return "\n".join(description_parts[:5])  # Limit to first 5 points

        return None

    async def _extract_features(self) -> list:
        """Extract key product features/bullet points"""
        features = []

        feature_elements = await self.page.query_selector_all(
            "#feature-bullets ul li span.a-list-item"
        )

        for element in feature_elements:
            text = await element.text_content()
            if text:
                text = text.strip()
                if text and len(text) > 10:
                    features.append(text)

        return features

    async def _extract_availability(self) -> Optional[str]:
        """Extract availability status"""
        selectors = [
            "#availability span",
            "#availability",
        ]

        for selector in selectors:
            availability = await self.extract_text(selector)
            if availability:
                return availability

        return None


# Example usage
async def main():
    """Test the product scraper"""
    from loguru import logger
    logger.add("logs/product_scraper_test.log", rotation="10 MB")

    # Example ASIN (replace with actual ASIN)
    test_asin = "B0BNKKLJ8V"

    async with ProductScraper() as scraper:
        product_data = await scraper.scrape(test_asin)
        logger.info(f"Product data: {product_data}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
