"""
Review scraper
Collects customer reviews from Amazon product pages
"""
import re
from typing import Dict, List, Any, Optional
from loguru import logger
from datetime import datetime
from dateutil import parser as date_parser

from scrapers.base_scraper import BaseScraper
from config.settings import AMAZON_SETTINGS, REVIEW_ANALYSIS


class ReviewScraper(BaseScraper):
    """
    Scrapes customer reviews from Amazon product detail pages (/dp/ASIN)

    NOTE: This scraper ONLY uses the product detail page (/dp/ASIN) for review collection.
    The separate /product-reviews/ page has different structure and is often blocked by Amazon.

    Available methods:
    - scrape_from_product_page(): Scrape reviews from /dp/ASIN page (RECOMMENDED)
    - scrape_review_summary(): Scrape review statistics from /dp/ASIN page

    Collects:
    - Review text
    - Rating (1-5 stars)
    - Review title
    - Reviewer name
    - Review date
    - Verified purchase status
    - Helpful votes
    """

    def __init__(self):
        super().__init__()
        self.base_url = AMAZON_SETTINGS["base_url"]

    async def scrape(
        self,
        asin: str,
        max_reviews: int = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Abstract method implementation - delegates to scrape_from_product_page

        Args:
            asin: Product ASIN
            max_reviews: Maximum number of reviews to collect

        Returns:
            list: Review data
        """
        return await self.scrape_from_product_page(asin=asin, max_reviews=max_reviews)

    async def scrape_from_product_page(
        self,
        asin: str,
        max_reviews: int = None,
        navigate: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Scrape reviews from product detail page (without navigating to review pages)

        This method scrapes the ~15 reviews visible at the bottom of product detail pages.
        Avoids Amazon's bot detection on separate review pages.

        Args:
            asin: Product ASIN
            max_reviews: Maximum number of reviews to collect (default: 15)
            navigate: If True, navigate to product page first. If False, assume already on page.

        Returns:
            list: Review data
        """
        if max_reviews is None:
            max_reviews = 15  # Typically 10-15 reviews visible on product page

        logger.info(f"Scraping reviews from product detail page: {asin} (max: {max_reviews})")

        # Navigate to product page if needed
        if navigate:
            url = f"{self.base_url}/dp/{asin}"
            success = await self.goto(url)
            if not success:
                logger.error(f"Failed to load product page: {asin}")
                return []

            # Wait for main product container (combined selector, 3s timeout)
            await self.wait_for_selector(
                "#dp-container, #productTitle, #ppd, #centerCol, #dp",
                timeout=3000
            )

        # Scroll down to reviews section
        try:
            # Scroll to bottom of page to load reviews
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            logger.debug("Scrolled to bottom of page")

            # Wait a bit for reviews to load
            await self.page.wait_for_timeout(2000)

            # Scroll back up a bit to center reviews
            await self.page.evaluate("window.scrollBy(0, -500)")
            await self.page.wait_for_timeout(1000)

        except Exception as e:
            logger.warning(f"Could not scroll to reviews: {e}")

        # Wait for reviews section - combined selector for efficiency
        # Amazon uses different container classes for reviews with/without images
        combined_review_selector = (
            "[data-hook='review'], "
            "div[id^='customer_review'], "
            "#cm-cr-dp-review-list [data-hook='review'], "
            "#reviewsMedley [data-hook='review'], "
            ".review.aok-relative"
        )

        # Single check with reasonable timeout (3 seconds total, not 45)
        has_reviews = await self.wait_for_selector(combined_review_selector, timeout=3000)

        if not has_reviews:
            logger.warning("No reviews found on product detail page")
            return []

        logger.debug("Reviews section detected")

        # Extract reviews from page
        reviews = await self._extract_reviews_from_page()

        if not reviews:
            logger.warning("Could not extract any reviews from product page")
            return []

        # Limit to max_reviews
        reviews = reviews[:max_reviews]

        # Filter by minimum length
        min_length = REVIEW_ANALYSIS["min_review_length"]
        reviews = [r for r in reviews if len(r.get("text", "")) >= min_length]

        logger.success(f"Collected {len(reviews)} reviews from product detail page")
        return reviews

    # =========================================================================
    # DEPRECATED: /product-reviews/ page scraping method
    # =========================================================================
    # The scrape() method below is COMMENTED OUT because:
    # 1. Amazon's /product-reviews/ page has different structure than /dp/ page
    # 2. /product-reviews/ page is often blocked by Amazon's bot detection
    # 3. Use scrape_from_product_page() instead for reliable review collection
    # =========================================================================
    #
    # async def scrape(
    #     self,
    #     asin: str,
    #     max_reviews: int = None,
    #     sort_by: str = "helpful"
    # ) -> List[Dict[str, Any]]:
    #     """
    #     Scrape reviews for a product (DEPRECATED - use scrape_from_product_page instead)
    #
    #     This method navigates to separate review pages which Amazon blocks.
    #     Use scrape_from_product_page() instead to scrape from product detail pages.
    #
    #     Args:
    #         asin: Product ASIN
    #         max_reviews: Maximum number of reviews to collect
    #         sort_by: Sort order (helpful, recent)
    #
    #     Returns:
    #         list: Review data
    #     """
    #     if max_reviews is None:
    #         max_reviews = REVIEW_ANALYSIS["max_reviews_per_product"]
    #
    #     logger.info(f"Scraping reviews for ASIN: {asin} (max: {max_reviews})")
    #
    #     reviews = []
    #     page = 1
    #     max_page = (max_reviews // 10) + 1  # Amazon shows 10 reviews per page
    #
    #     # Build reviews URL
    #     sort_param = "helpful" if sort_by == "helpful" else "recent"
    #     base_reviews_url = f"{self.base_url}/product-reviews/{asin}/ref=cm_cr_arp_d_viewopt_sr"
    #
    #     while page <= max_page and len(reviews) < max_reviews:
    #         url = f"{base_reviews_url}?sortBy={sort_param}&pageNumber={page}"
    #
    #         success = await self.goto(url)
    #         if not success:
    #             logger.error(f"Failed to load reviews page {page}")
    #             break
    #
    #         # Wait for reviews container - try multiple selectors
    #         has_reviews = False
    #         for selector in [
    #             "[data-hook='review']",
    #             "div[id^='customer_review']",
    #             ".review.aok-relative",
    #             ".a-section.review"
    #         ]:
    #             has_reviews = await self.wait_for_selector(selector, timeout=10000)
    #             if has_reviews:
    #                 logger.debug(f"Found reviews with selector: {selector}")
    #                 break
    #
    #         if not has_reviews:
    #             logger.warning(f"No reviews found on page {page}")
    #             break
    #
    #         # Extract reviews from page
    #         page_reviews = await self._extract_reviews_from_page()
    #
    #         if not page_reviews:
    #             logger.warning(f"Could not extract reviews from page {page}")
    #             break
    #
    #         reviews.extend(page_reviews)
    #         logger.info(f"Collected {len(page_reviews)} reviews from page {page}")
    #
    #         page += 1
    #
    #     # Limit to max_reviews
    #     reviews = reviews[:max_reviews]
    #
    #     # Filter by minimum length
    #     min_length = REVIEW_ANALYSIS["min_review_length"]
    #     reviews = [r for r in reviews if len(r.get("text", "")) >= min_length]
    #
    #     logger.success(f"Total reviews collected: {len(reviews)}")
    #     return reviews
    #
    # =========================================================================
    # END DEPRECATED METHOD
    # =========================================================================

    async def _extract_reviews_from_page(self) -> List[Dict[str, Any]]:
        """Extract all reviews from current page"""
        reviews = []

        # Try multiple selectors to find review containers
        # Amazon uses different container classes for reviews with/without images
        review_elements = []
        for selector in [
            ".cm_cr_grid_center_right_images_widget [data-hook='review']",
            ".cm_cr_grid_center_right_non_images_widgets [data-hook='review']",
            "[data-hook='review']",
            "div[id^='customer_review']",
            ".review.aok-relative",
            ".a-section.review"
        ]:
            review_elements = await self.page.query_selector_all(selector)
            if review_elements:
                logger.debug(f"Found {len(review_elements)} reviews with selector: {selector}")
                break

        # If no reviews found with specific selectors, try finding within the container widgets
        if not review_elements:
            for container_selector in [
                ".cm_cr_grid_center_right_images_widget",
                ".cm_cr_grid_center_right_non_images_widgets"
            ]:
                containers = await self.page.query_selector_all(container_selector)
                if containers:
                    logger.debug(f"Found container: {container_selector}, extracting reviews...")
                    for container in containers:
                        # Look for review elements within container
                        inner_reviews = await container.query_selector_all("[data-hook='review']")
                        if inner_reviews:
                            review_elements.extend(inner_reviews)
                    if review_elements:
                        logger.debug(f"Found {len(review_elements)} reviews within containers")
                        break

        if not review_elements:
            logger.warning("No review elements found with any selector")
            return reviews

        for element in review_elements:
            try:
                review_data = await self._extract_review_data(element)
                if review_data:
                    reviews.append(review_data)
            except Exception as e:
                logger.debug(f"Failed to extract review: {e}")
                continue

        return reviews

    async def _extract_review_data(self, element) -> Optional[Dict[str, Any]]:
        """Extract data from a single review element"""
        try:
            # Rating
            rating_element = await element.query_selector("[data-hook='review-star-rating']")
            rating_text = await rating_element.get_attribute("class") if rating_element else None
            rating = None
            if rating_text:
                match = re.search(r"a-star-(\d+)", rating_text)
                if match:
                    rating = int(match.group(1))

            # Review title
            title_element = await element.query_selector("[data-hook='review-title']")
            title = await title_element.text_content() if title_element else None
            if title:
                title = title.strip()

            # Review text
            text_element = await element.query_selector("[data-hook='review-body']")
            text = await text_element.text_content() if text_element else None
            if text:
                text = text.strip()

            if not text or len(text) < 10:
                return None

            # Reviewer name
            name_element = await element.query_selector(".a-profile-name")
            reviewer_name = await name_element.text_content() if name_element else "Anonymous"

            # Review date
            date_element = await element.query_selector("[data-hook='review-date']")
            date_text = await date_element.text_content() if date_element else None
            review_date = None
            if date_text:
                # Parse date (format: "Reviewed in the United States on January 15, 2025")
                match = re.search(r"on\s+(.+)$", date_text)
                if match:
                    try:
                        review_date = date_parser.parse(match.group(1)).isoformat()
                    except:
                        review_date = None

            # Verified purchase
            verified_element = await element.query_selector("[data-hook='avp-badge']")
            verified = verified_element is not None

            # Helpful votes
            helpful_element = await element.query_selector("[data-hook='helpful-vote-statement']")
            helpful_text = await helpful_element.text_content() if helpful_element else None
            helpful_votes = 0
            if helpful_text:
                match = re.search(r"([\d,]+)\s+people found this helpful", helpful_text)
                if match:
                    helpful_votes = int(match.group(1).replace(",", ""))
                elif "One person found this helpful" in helpful_text:
                    helpful_votes = 1

            return {
                "rating": rating,
                "title": title,
                "text": text,
                "reviewer_name": reviewer_name,
                "review_date": review_date,
                "verified": verified,
                "helpful_votes": helpful_votes,
                "scraped_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.debug(f"Error extracting review data: {e}")
            return None

    async def scrape_review_summary(self, asin: str, navigate: bool = True) -> Dict[str, Any]:
        """
        Scrape review summary/statistics from product detail page (/dp/ASIN)

        This method extracts review summary from the product page instead of
        /product-reviews/ page which requires login.

        Args:
            asin: Product ASIN
            navigate: If True, navigate to product page first

        Returns:
            dict: Review statistics
        """
        if navigate:
            url = f"{self.base_url}/dp/{asin}"
            success = await self.goto(url)
            if not success:
                logger.error(f"Failed to load product page for review summary: {asin}")
                return {}

            # Wait for main product container
            await self.wait_for_selector("#dp-container", timeout=15000)

        # Extract review count from product page
        total_reviews = None
        avg_rating = None
        rating_breakdown = {}

        # Try to get total review count - multiple selectors
        for selector in [
            "#acrCustomerReviewText",
            "[data-hook='total-review-count']",
            "#reviewsMedley .a-size-base"
        ]:
            total_count_text = await self.extract_text(selector)
            if total_count_text:
                match = re.search(r"([\d,]+)", total_count_text)
                if match:
                    total_reviews = int(match.group(1).replace(",", ""))
                    logger.debug(f"Found review count: {total_reviews} with selector: {selector}")
                    break

        # Try to get average rating - multiple selectors
        for selector in [
            "#acrPopover .a-icon-alt",
            "[data-hook='rating-out-of-text']",
            "#averageCustomerReviews .a-icon-alt"
        ]:
            avg_rating_text = await self.extract_text(selector)
            if avg_rating_text:
                match = re.search(r"([\d.]+)\s*out of", avg_rating_text)
                if match:
                    avg_rating = float(match.group(1))
                    logger.debug(f"Found avg rating: {avg_rating} with selector: {selector}")
                    break

        # Try to get rating breakdown from histogram on product page
        # This is visible in the "Customer reviews" section
        histogram_selectors = [
            "#histogramTable tr",
            "#cm_cr_dp_d_histogramTable tr",
            ".cr-widget-Histogram tr"
        ]

        for hist_selector in histogram_selectors:
            rows = await self.page.query_selector_all(hist_selector)
            if rows and len(rows) >= 5:
                for i, row in enumerate(rows[:5]):
                    try:
                        # Extract percentage from each row
                        percentage_el = await row.query_selector(".a-text-right a, .a-size-base")
                        if percentage_el:
                            percentage_text = await percentage_el.text_content()
                            if percentage_text:
                                match = re.search(r"(\d+)%", percentage_text)
                                if match:
                                    star = 5 - i  # Rows are 5-star to 1-star
                                    rating_breakdown[f"{star}_star"] = int(match.group(1))
                    except Exception as e:
                        logger.debug(f"Error extracting histogram row: {e}")
                        continue
                if rating_breakdown:
                    logger.debug(f"Found rating breakdown: {rating_breakdown}")
                    break

        return {
            "total_reviews": total_reviews,
            "average_rating": avg_rating,
            "rating_breakdown": rating_breakdown,
            "scraped_at": datetime.now().isoformat(),
        }


# Example usage
async def main():
    """Test the review scraper - uses /dp/ASIN page only"""
    from loguru import logger
    logger.add("logs/review_scraper_test.log", rotation="10 MB")

    # Example ASIN (COSRX Snail Mucin)
    test_asin = "B08CMS8P67"

    async with ReviewScraper() as scraper:
        # Step 1: Get review summary from product page
        logger.info("=" * 60)
        logger.info("Step 1: Scraping review summary from /dp/ page...")
        summary = await scraper.scrape_review_summary(test_asin)
        logger.info(f"Review summary: {summary}")

        # Step 2: Get reviews from product page (already on page, no need to navigate again)
        logger.info("=" * 60)
        logger.info("Step 2: Scraping reviews from /dp/ page...")
        reviews = await scraper.scrape_from_product_page(
            test_asin,
            max_reviews=15,
            navigate=False  # Already on page from scrape_review_summary
        )

        logger.info(f"Collected {len(reviews)} reviews")

        for i, review in enumerate(reviews[:5], 1):  # Show first 5 reviews
            logger.info(
                f"\n--- Review {i} ---\n"
                f"Rating: {review.get('rating')}/5\n"
                f"Title: {review.get('title', 'N/A')[:50]}...\n"
                f"Text: {review.get('text', 'N/A')[:100]}...\n"
                f"Verified: {review.get('verified')}\n"
                f"Helpful: {review.get('helpful_votes')}"
            )

        logger.success(f"Total reviews collected: {len(reviews)}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
