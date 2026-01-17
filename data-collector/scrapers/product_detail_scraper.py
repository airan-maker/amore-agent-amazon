"""
Product detail scraper for Amazon product pages
Extracts comprehensive product information including features, specs, and reviews
"""
import re
from typing import Dict, Any, Optional, List
from loguru import logger
from datetime import datetime

from scrapers.base_scraper import BaseScraper


class ProductDetailScraper(BaseScraper):
    """
    Scrapes detailed information from Amazon product pages

    Collects:
    - Product title and price
    - Images
    - Product features and specifications
    - Ingredients/materials
    - Customer reviews (for summarization)
    - Rating distribution
    """

    async def scrape(self, asin: str, product_url: str = None) -> Dict[str, Any]:
        """
        Scrape detailed product information

        Args:
            asin: Product ASIN
            product_url: Full product URL (optional, will construct if not provided)

        Returns:
            dict: Detailed product information
        """
        # Construct URL if not provided
        if not product_url:
            product_url = f"https://www.amazon.com/dp/{asin}"
        elif not product_url.startswith("http"):
            product_url = f"https://www.amazon.com{product_url}"

        logger.info(f"Scraping product details for ASIN: {asin}")

        # Navigate to product page
        success = await self.goto(product_url)
        if not success:
            logger.error(f"Failed to load product page: {product_url}")
            return {"asin": asin, "error": "Failed to load page"}

        # Wait for product content
        await self.wait_for_selector("#productTitle", timeout=15000)
        await self.random_delay(2, 3)

        # Extract all product information
        product_data = {
            "asin": asin,
            "url": product_url,
            "scraped_at": datetime.now().isoformat(),
        }

        # Basic info
        product_data["title"] = await self._extract_title()
        product_data["price"] = await self._extract_price()
        product_data["rating"] = await self._extract_rating()
        product_data["review_count"] = await self._extract_review_count()

        # Images
        product_data["images"] = await self._extract_images()

        # Product features
        product_data["features"] = await self._extract_features()
        product_data["about_items"] = await self._extract_about_items()

        # Specifications
        product_data["specifications"] = await self._extract_specifications()

        # Product details
        product_data["product_details"] = await self._extract_product_details()

        # Reviews (sample for summarization)
        product_data["sample_reviews"] = await self._extract_sample_reviews(max_reviews=20)

        logger.success(f"✓ Product details scraped for {asin}")

        return product_data

    async def _extract_title(self) -> Optional[str]:
        """Extract product title"""
        try:
            title = await self.extract_text("#productTitle")
            return title
        except Exception as e:
            logger.debug(f"Failed to extract title: {e}")
            return None

    async def _extract_price(self) -> Optional[Dict[str, Any]]:
        """Extract price information"""
        try:
            price_info = {}

            # Try different price selectors
            selectors = [
                ".a-price .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice",
                ".a-price-whole",
            ]

            for selector in selectors:
                price_text = await self.extract_text(selector)
                if price_text:
                    # Extract numeric value
                    match = re.search(r'\$?([\d,]+\.?\d*)', price_text)
                    if match:
                        price_info["price"] = float(match.group(1).replace(",", ""))
                        price_info["currency"] = "USD"
                        price_info["formatted"] = price_text
                        break

            return price_info if price_info else None

        except Exception as e:
            logger.debug(f"Failed to extract price: {e}")
            return None

    async def _extract_rating(self) -> Optional[float]:
        """Extract average rating"""
        try:
            rating_text = await self.extract_text("#acrPopover")
            if rating_text:
                match = re.search(r'([\d.]+)\s*out of\s*5', rating_text)
                if match:
                    return float(match.group(1))
            return None
        except Exception as e:
            logger.debug(f"Failed to extract rating: {e}")
            return None

    async def _extract_review_count(self) -> Optional[int]:
        """Extract total review count"""
        try:
            review_text = await self.extract_text("#acrCustomerReviewText")
            if review_text:
                match = re.search(r'([\d,]+)', review_text)
                if match:
                    return int(match.group(1).replace(",", ""))
            return None
        except Exception as e:
            logger.debug(f"Failed to extract review count: {e}")
            return None

    async def _extract_images(self) -> List[str]:
        """Extract product images"""
        try:
            images = []

            # Get image URLs
            img_elements = await self.page.query_selector_all("#altImages img")
            for img in img_elements[:6]:  # First 6 images
                src = await img.get_attribute("src")
                if src and "data:image" not in src:
                    # Convert thumbnail to larger image
                    large_src = re.sub(r'_[A-Z]{2}\d+_', '_AC_SL1500_', src)
                    images.append(large_src)

            return images

        except Exception as e:
            logger.debug(f"Failed to extract images: {e}")
            return []

    async def _extract_features(self) -> List[str]:
        """Extract key product features"""
        try:
            features = []

            # Feature bullets
            feature_elements = await self.page.query_selector_all("#feature-bullets li")
            for element in feature_elements:
                text = await element.text_content()
                if text and text.strip():
                    features.append(text.strip())

            return features

        except Exception as e:
            logger.debug(f"Failed to extract features: {e}")
            return []

    async def _extract_about_items(self) -> List[str]:
        """Extract 'About this item' section"""
        try:
            items = []

            selectors = [
                "#feature-bullets ul li span",
                ".a-unordered-list.a-vertical li",
            ]

            for selector in selectors:
                elements = await self.page.query_selector_all(selector)
                if elements:
                    for element in elements:
                        text = await element.text_content()
                        if text and text.strip() and len(text.strip()) > 10:
                            items.append(text.strip())
                    if items:
                        break

            return items[:10]  # Limit to 10 items

        except Exception as e:
            logger.debug(f"Failed to extract about items: {e}")
            return []

    async def _extract_specifications(self) -> Dict[str, str]:
        """Extract product specifications"""
        try:
            specs = {}

            # Product information table
            spec_elements = await self.page.query_selector_all(".prodDetTable tr, .a-keyvalue tr")

            for element in spec_elements:
                try:
                    th = await element.query_selector("th")
                    td = await element.query_selector("td")

                    if th and td:
                        key = await th.text_content()
                        value = await td.text_content()

                        if key and value:
                            specs[key.strip()] = value.strip()
                except:
                    continue

            return specs

        except Exception as e:
            logger.debug(f"Failed to extract specifications: {e}")
            return {}

    async def _extract_product_details(self) -> Dict[str, Any]:
        """Extract additional product details"""
        try:
            details = {}

            # Scent, size, color variants
            variant_selectors = {
                "scent": "#variation_scent_name",
                "size": "#variation_size_name",
                "color": "#variation_color_name",
            }

            for key, selector in variant_selectors.items():
                value = await self.extract_text(f"{selector} .selection")
                if value:
                    details[key] = value

            # Brand - Extract from "Visit the [brand name] Store" pattern
            brand = await self.extract_text("#bylineInfo")
            if brand:
                # Try to extract from "Visit the [brand name] Store" pattern
                import re

                # Pattern 1: "Visit the [Brand Name] Store"
                match = re.search(r'Visit\s+the\s+(.+?)\s+Store', brand, re.IGNORECASE)
                if match:
                    details["brand"] = match.group(1).strip()
                else:
                    # Pattern 2: "Brand: [Brand Name]" or just "[Brand Name]"
                    # Fallback to simple cleanup if pattern not found
                    cleaned = brand.replace("Visit the", "").replace("Store", "").replace("Brand:", "").strip()
                    # Remove trailing special characters
                    cleaned = re.sub(r'[›»]+\s*$', '', cleaned).strip()
                    if cleaned and cleaned not in ["Shop the Store on Amazon", ""]:
                        details["brand"] = cleaned
                    else:
                        # If still invalid, don't set brand (will be extracted from product name later)
                        pass

            return details

        except Exception as e:
            logger.debug(f"Failed to extract product details: {e}")
            return {}

    async def _extract_sample_reviews(self, max_reviews: int = 20) -> List[Dict[str, Any]]:
        """Extract sample reviews for summarization"""
        try:
            reviews = []

            # Scroll to reviews section
            await self.page.evaluate("""
                () => {
                    const reviewsSection = document.querySelector('#reviewsMedley');
                    if (reviewsSection) {
                        reviewsSection.scrollIntoView();
                    }
                }
            """)

            await self.random_delay(2, 3)

            # Extract review elements
            review_elements = await self.page.query_selector_all("[data-hook='review']")

            for element in review_elements[:max_reviews]:
                try:
                    review = {}

                    # Rating
                    rating_element = await element.query_selector(".review-rating")
                    if rating_element:
                        rating_text = await rating_element.text_content()
                        match = re.search(r'([\d.]+)', rating_text)
                        if match:
                            review["rating"] = float(match.group(1))

                    # Title
                    title_element = await element.query_selector("[data-hook='review-title']")
                    if title_element:
                        review["title"] = (await title_element.text_content()).strip()

                    # Text
                    text_element = await element.query_selector("[data-hook='review-body']")
                    if text_element:
                        review["text"] = (await text_element.text_content()).strip()

                    # Helpful votes
                    helpful_element = await element.query_selector("[data-hook='helpful-vote-statement']")
                    if helpful_element:
                        helpful_text = await helpful_element.text_content()
                        match = re.search(r'([\d,]+)', helpful_text)
                        if match:
                            review["helpful_votes"] = int(match.group(1).replace(",", ""))

                    if review.get("text"):
                        reviews.append(review)

                except Exception as e:
                    logger.debug(f"Failed to extract individual review: {e}")
                    continue

            logger.info(f"Extracted {len(reviews)} sample reviews")
            return reviews

        except Exception as e:
            logger.debug(f"Failed to extract reviews: {e}")
            return []


# Example usage
async def main():
    """Test product detail scraper"""
    asin = "B0DPHQRLJC"  # Example ASIN from user

    async with ProductDetailScraper() as scraper:
        product_data = await scraper.scrape(asin)

        logger.info("\n" + "="*60)
        logger.info("PRODUCT DETAILS")
        logger.info("="*60)
        logger.info(f"Title: {product_data.get('title')}")
        logger.info(f"Price: {product_data.get('price')}")
        logger.info(f"Rating: {product_data.get('rating')}")
        logger.info(f"Reviews: {product_data.get('review_count')}")
        logger.info(f"\nFeatures: {len(product_data.get('features', []))}")
        logger.info(f"Sample Reviews: {len(product_data.get('sample_reviews', []))}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
