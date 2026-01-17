"""
Collect detailed information for all products in catalog
Scrapes product pages and analyzes with Claude AI
"""
import asyncio
import json
from pathlib import Path
from loguru import logger
from datetime import datetime

from scrapers.product_detail_scraper import ProductDetailScraper
from analyzers.product_analyzer import ProductAnalyzer
from config.settings import OUTPUT_DIR, DATA_DIR

# Setup logging
logger.add(
    "logs/product_details_{time}.log",
    rotation="10 MB",
    level="INFO"
)


async def collect_product_details(
    category_products_file: str,
    max_products_per_category: int = 10,  # Limit for testing
    output_file: str = None
):
    """
    Collect detailed information for products

    Args:
        category_products_file: Path to category products JSON
        max_products_per_category: Max products to detail per category
        output_file: Output file path (optional)
    """
    logger.info("="*80)
    logger.info("PRODUCT DETAIL COLLECTION")
    logger.info("="*80)

    # Load category products
    with open(category_products_file, 'r', encoding='utf-8') as f:
        category_data = json.load(f)

    # Initialize scrapers and analyzer
    analyzer = ProductAnalyzer()
    product_details = {}

    async with ProductDetailScraper() as scraper:
        for category_name, category_info in category_data.items():
            if not category_info.get("success"):
                logger.warning(f"Skipping {category_name} (not successful)")
                continue

            products = category_info.get("products", [])
            if not products:
                logger.warning(f"No products in {category_name}")
                continue

            logger.info(f"\n{'='*80}")
            logger.info(f"Category: {category_name}")
            logger.info(f"Total products: {len(products)}")
            logger.info(f"Will collect details for: {min(len(products), max_products_per_category)}")
            logger.info(f"{'='*80}\n")

            # Limit products for testing
            products_to_scrape = products[:max_products_per_category]

            for idx, product in enumerate(products_to_scrape, 1):
                asin = product.get("asin")
                product_url = product.get("product_url")

                if not asin:
                    logger.warning(f"Skipping product without ASIN")
                    continue

                logger.info(f"\n[{idx}/{len(products_to_scrape)}] Processing: {asin}")
                logger.info(f"  Name: {product.get('product_name', 'N/A')[:60]}...")

                try:
                    # Scrape detailed information
                    detail_data = await scraper.scrape(asin, product_url)

                    # Analyze with Claude
                    logger.info("  Analyzing with Claude AI...")
                    analysis = analyzer.analyze_product(detail_data)

                    # Combine all data
                    product_details[asin] = {
                        "basic_info": product,  # Original catalog info
                        "detailed_info": detail_data,  # Scraped details
                        "analysis": analysis,  # AI analysis
                        "category": category_name,
                        "processed_at": datetime.now().isoformat()
                    }

                    logger.success(f"  ✓ Complete: {asin}")

                    # Save incrementally
                    if output_file:
                        _save_intermediate(product_details, output_file)

                    # Rate limiting
                    await asyncio.sleep(3)

                except Exception as e:
                    logger.error(f"  ✗ Failed to process {asin}: {e}")
                    product_details[asin] = {
                        "basic_info": product,
                        "error": str(e),
                        "category": category_name
                    }
                    continue

            logger.info(f"\n✓ Completed category: {category_name}")
            logger.info(f"  Collected: {sum(1 for p in product_details.values() if 'analysis' in p)}/{len(products_to_scrape)}")

    # Final save
    if not output_file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUT_DIR / f"product_details_{timestamp}.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(product_details, f, indent=2, ensure_ascii=False)

    logger.success(f"\n{'='*80}")
    logger.success(f"✅ COLLECTION COMPLETE")
    logger.success(f"📊 Total products detailed: {len(product_details)}")
    logger.success(f"💾 Saved to: {output_file}")
    logger.success(f"{'='*80}")

    return product_details


def _save_intermediate(data: dict, output_file: str):
    """Save intermediate results"""
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.debug(f"Failed to save intermediate: {e}")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Collect product details")
    parser.add_argument(
        "--input",
        default="output/test_5_categories_latest.json",
        help="Input category products file"
    )
    parser.add_argument(
        "--max-per-category",
        type=int,
        default=10,
        help="Max products to detail per category (default: 10)"
    )
    parser.add_argument(
        "--output",
        help="Output file path (optional)"
    )

    args = parser.parse_args()

    # Find latest test file if not specified
    input_file = args.input
    if "latest" in input_file:
        # Find most recent test file
        test_files = list(OUTPUT_DIR.glob("test_5_categories_*.json"))
        if test_files:
            input_file = max(test_files, key=lambda p: p.stat().st_mtime)
            logger.info(f"Using latest file: {input_file}")
        else:
            logger.error("No test files found!")
            return

    await collect_product_details(
        category_products_file=input_file,
        max_products_per_category=args.max_per_category,
        output_file=args.output
    )


if __name__ == "__main__":
    asyncio.run(main())
