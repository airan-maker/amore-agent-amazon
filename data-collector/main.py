"""
Main entry point for Amazon Data Collector
Orchestrates the entire data collection and processing pipeline
"""
import os
import asyncio
import yaml
import json
from pathlib import Path
from loguru import logger
from datetime import datetime
import argparse

from config.settings import (
    CONFIG_DIR,
    OUTPUT_DIR,
    LOGGING,
    DATA_DIR,
)

# Import scrapers
from scrapers.product_scraper import ProductScraper
from scrapers.rank_scraper import RankScraper
from scrapers.review_scraper import ReviewScraper

# Import utilities
from utils.cache_manager import CacheManager

# Setup logging
logger.add(
    LOGGING["log_file"],
    rotation=LOGGING["rotation"],
    retention=LOGGING["retention"],
    format=LOGGING["format"],
    level=LOGGING["level"],
)


class DataCollectionPipeline:
    """Main pipeline for collecting and processing Amazon data"""

    def __init__(self):
        self.products_config = self._load_config("products.yaml")
        self.categories_config = self._load_config("categories.yaml")
        self.scheduler_config = self._load_config("scheduler_config.yaml")

        # Create output directory
        OUTPUT_DIR.mkdir(exist_ok=True)

        # Initialize cache manager
        cache_dir = DATA_DIR / "cache"
        cache_ttl = self.scheduler_config.get("cache", {}).get("ttl_hours", 24)
        self.cache_manager = CacheManager(cache_dir, cache_ttl_hours=cache_ttl)

        # Clean up expired cache entries on startup
        self.cache_manager.clear_expired()
        cache_stats = self.cache_manager.get_stats()
        logger.info(f"Cache initialized: {cache_stats['valid_entries']} valid entries (TTL: {cache_stats['cache_ttl_hours']}h)")

        # Storage for collected data
        self.collected_data = {
            "products": {},
            "ranks": {},
            "reviews": {},
            "attributes": {},  # Step 7: Extracted product attributes
        }

    def _load_config(self, filename: str) -> dict:
        """Load YAML configuration file"""
        config_path = CONFIG_DIR / filename
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    async def run_full_pipeline(self):
        """Execute the complete data collection and analysis pipeline"""
        logger.info("=" * 60)
        logger.info("Starting Amazon Data Collection Pipeline - FULL (Optimized)")
        logger.info("=" * 60)

        try:
            # Step 1: Collect rankings FIRST to identify important products
            logger.info("\n[STEP 1/8] Collecting Best Sellers rankings...")
            await self.collect_rankings()

            # Step 2: Enrich ranked products with detailed information
            # This now includes core_products + all ranked products
            logger.info("\n[STEP 2/8] Enriching ranked products with detailed information...")
            await self.enrich_ranked_products()

            # Step 3: Collect reviews for core products
            logger.info("\n[STEP 3/8] Collecting product reviews...")
            await self.collect_reviews()

            # Step 4: Save collected data
            logger.info("\n[STEP 4/8] Saving raw collected data...")
            self.save_raw_data()

            # Step 5: Generate M1 data
            logger.info("\n[STEP 5/8] Generating M1 Market Landscape Data...")
            self.generate_m1_data()

            # Step 6: Generate M2 data
            logger.info("\n[STEP 6/8] Generating M2 Review Intelligence Data...")
            await self.generate_m2_data()

            # Step 7: Extract product attributes using Claude API
            logger.info("\n[STEP 7/8] Extracting product attributes with Claude API...")
            await self.extract_attributes()

            # Step 8: Generate product ideas based on market gaps
            logger.info("\n[STEP 8/8] Generating AI-powered product ideas...")
            await self.generate_product_ideas()

            logger.success("\n" + "=" * 60)
            logger.success("✅ COMPLETE PIPELINE FINISHED SUCCESSFULLY!")
            logger.success("=" * 60)

            # Print summary
            self.print_summary()

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            raise

    async def collect_rankings(self):
        """
        Collect Best Sellers rankings across 24 hierarchical categories (PARALLEL OPTIMIZED)
        Supports 3-depth category hierarchy with parallel batch processing
        """
        hierarchy = self.categories_config.get("hierarchy", {})

        # Flatten all enabled categories from all depths
        all_categories = []

        # Process depth_0
        for cat in hierarchy.get("depth_0", []):
            if cat.get("track_enabled"):
                all_categories.append(cat)

        # Process depth_1
        for cat in hierarchy.get("depth_1", []):
            if cat.get("track_enabled"):
                all_categories.append(cat)

        # Process depth_2
        for cat in hierarchy.get("depth_2", []):
            if cat.get("track_enabled"):
                all_categories.append(cat)

        total_categories = len(all_categories)
        logger.info(f"📋 총 {total_categories}개 카테고리 수집 시작")

        # Get parallel processing configuration
        performance_config = self.scheduler_config.get("performance", {})
        parallel_limit = performance_config.get("parallel_categories", 4)

        # Get randomized category delays from SCRAPER_SETTINGS
        from config.settings import SCRAPER_SETTINGS
        import random
        category_delay_min = SCRAPER_SETTINGS.get("category_delay_min", 15)
        category_delay_max = SCRAPER_SETTINGS.get("category_delay_max", 30)

        logger.info(f"⚡ 병렬 처리: {parallel_limit}개 카테고리 동시 수집")
        logger.info(f"⏱️  카테고리 간 딜레이: {category_delay_min}-{category_delay_max}초 (랜덤)")

        # Helper function to scrape a single category
        async def scrape_category(scraper, category, idx):
            """Scrape a single category with error handling"""
            cat_name = category.get("name")
            cat_url = category.get("url")
            max_rank = category.get("track_top_n", 100)

            logger.info(f"[{idx}/{total_categories}] 수집 중: {cat_name}")

            try:
                # Use ranking cache if enabled
                cache_config = self.scheduler_config.get("cache", {})
                use_ranking_cache = cache_config.get("use_for_rankings", True)

                if use_ranking_cache:
                    cache_key = f"ranking_{cat_name}"
                    cached_rankings = self.cache_manager.get(cache_key)

                    if cached_rankings:
                        self.collected_data["ranks"][cat_name] = cached_rankings
                        logger.success(f"[{idx}/{total_categories}] 💾 {cat_name}: {len(cached_rankings)} products (cached)")
                        return {"success": True, "cached": True, "count": len(cached_rankings)}

                # Scrape rankings
                rankings = await scraper.scrape(
                    cat_url,
                    max_rank=max_rank,
                    use_hybrid=True
                )

                # Store results
                self.collected_data["ranks"][cat_name] = rankings

                # Cache the rankings
                if use_ranking_cache:
                    cache_key = f"ranking_{cat_name}"
                    self.cache_manager.set(cache_key, rankings)

                logger.success(f"[{idx}/{total_categories}] ✓ {cat_name}: {len(rankings)} products")
                return {"success": True, "cached": False, "count": len(rankings)}

            except Exception as e:
                logger.error(f"[{idx}/{total_categories}] ✗ {cat_name} 실패: {e}")
                self.collected_data["ranks"][cat_name] = {
                    "success": False,
                    "error": str(e),
                    "products": []
                }
                return {"success": False, "error": str(e)}

        # Process categories in parallel batches
        async with RankScraper() as scraper:
            for i in range(0, total_categories, parallel_limit):
                batch = all_categories[i:i+parallel_limit]
                batch_num = i // parallel_limit + 1
                total_batches = (total_categories + parallel_limit - 1) // parallel_limit

                logger.info(f"📦 배치 {batch_num}/{total_batches} 시작 ({len(batch)} categories)...")

                # Execute batch in parallel
                tasks = [
                    scrape_category(scraper, cat, i+j+1)
                    for j, cat in enumerate(batch)
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Log batch results
                success_count = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
                cached_count = sum(1 for r in results if isinstance(r, dict) and r.get("cached"))

                logger.info(f"✓ 배치 {batch_num} 완료: {success_count}/{len(batch)} 성공 ({cached_count} cached)")

                # Randomized delay between batches (except for last batch)
                if i + parallel_limit < total_categories:
                    # Use longer, randomized delays to avoid bot detection
                    batch_delay = random.uniform(category_delay_min, category_delay_max)
                    logger.info(f"⏱️  다음 배치까지 {batch_delay:.1f}초 대기 (봇 탐지 회피)...")
                    await asyncio.sleep(batch_delay)

        # Calculate and log final statistics
        total_products = 0
        successful_categories = 0

        for cat_name, rankings in self.collected_data["ranks"].items():
            if isinstance(rankings, list):
                total_products += len(rankings)
                successful_categories += 1
            elif isinstance(rankings, dict) and rankings.get("success") != False:
                products = rankings.get("products", [])
                total_products += len(products)
                if products:
                    successful_categories += 1

        logger.success(f"✅ 전체 수집 완료:")
        logger.success(f"  - 성공한 카테고리: {successful_categories}/{total_categories}")
        logger.success(f"  - 총 수집 제품 수: {total_products}")

    async def enrich_ranked_products(self):
        """
        Enrich ranked products with detailed information (OPTIMIZED with parallel processing)
        Collects brand, breadcrumb, images, description for all ranked products
        Core products are prioritized and processed first
        """
        # Get enrichment configuration
        enrichment_config = self.scheduler_config.get("product_enrichment", {})
        enabled = enrichment_config.get("enabled", True)
        strategy = enrichment_config.get("strategy", "all")
        top_n = enrichment_config.get("top_n_per_category", 100)
        max_retries = enrichment_config.get("max_retries_per_product", 2)
        delay = enrichment_config.get("delay_between_products", 2)
        batch_size = enrichment_config.get("batch_size", 5)  # Parallel batch size

        if not enabled:
            logger.warning("Product enrichment is disabled in configuration")
            return

        logger.info(f"Enrichment strategy: {strategy}")
        logger.info(f"Parallel batch size: {batch_size}")
        if strategy == "top_n":
            logger.info(f"Will enrich top {top_n} products per category")

        # PRIORITY 1: Core products (from products.yaml)
        core_asins = set()
        for product_config in self.products_config.get("core_products", []):
            if product_config.get("asin"):
                core_asins.add(product_config["asin"])

        logger.info(f"Core products to prioritize: {len(core_asins)}")

        # PRIORITY 2: Ranked products based on strategy
        ranked_asins = set()

        if strategy == "all":
            # Enrich all ranked products
            for category_name, rankings in self.collected_data["ranks"].items():
                for product in rankings:
                    # Ensure product is a dict before accessing attributes
                    if isinstance(product, dict) and product.get("asin"):
                        ranked_asins.add(product["asin"])

        elif strategy == "top_n":
            # Enrich only top N products per category
            for category_name, rankings in self.collected_data["ranks"].items():
                for product in rankings[:top_n]:
                    # Ensure product is a dict before accessing attributes
                    if isinstance(product, dict) and product.get("asin"):
                        ranked_asins.add(product["asin"])

        elif strategy == "none":
            logger.info("Enrichment strategy is 'none', skipping ranked products")
            # Still enrich core products even if strategy is 'none'

        # Combine: core products first, then ranked products (remove duplicates)
        asins_to_enrich = list(core_asins) + [asin for asin in ranked_asins if asin not in core_asins]
        total_asins = len(asins_to_enrich)

        logger.info(f"Total unique products to enrich: {total_asins}")
        logger.info(f"  - Core products: {len(core_asins)}")
        logger.info(f"  - Additional ranked products: {len(ranked_asins - core_asins)}")

        # Track enrichment progress
        enriched_count = 0
        failed_count = 0
        skipped_count = 0

        async def enrich_single_product(scraper, asin, idx):
            """Helper function to enrich a single product (with caching)"""
            nonlocal enriched_count, failed_count, skipped_count

            # Skip if already have detailed data in current session
            if asin in self.collected_data["products"]:
                existing_data = self.collected_data["products"][asin]
                if existing_data.get("brand") or existing_data.get("breadcrumb"):
                    logger.debug(f"[{idx}/{total_asins}] {asin} - Already enriched in session, skipping")
                    skipped_count += 1
                    return True

            # Check cache first
            cached_data = self.cache_manager.get(asin)
            if cached_data:
                self.collected_data["products"][asin] = cached_data
                enriched_count += 1
                logger.success(f"[{idx}/{total_asins}] 💾 {asin} - Loaded from cache")
                return True

            # Try scraping with retries
            for attempt in range(max_retries):
                try:
                    # Scrape detailed product information
                    product_data = await scraper.scrape(asin)

                    # Store enriched data
                    self.collected_data["products"][asin] = product_data

                    # Cache the data for future use
                    self.cache_manager.set(asin, product_data)

                    enriched_count += 1
                    logger.success(f"[{idx}/{total_asins}] ✓ {asin} - {product_data.get('product_name', '')[:50]}")
                    return True

                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"[{idx}/{total_asins}] ⚠ {asin} - Attempt {attempt + 1} failed, retrying...")
                        await asyncio.sleep(delay * 2)
                    else:
                        logger.error(f"[{idx}/{total_asins}] ✗ {asin} - Failed after {max_retries} attempts")
                        failed_count += 1

                        # Store error
                        self.collected_data["products"][asin] = {
                            "asin": asin,
                            "error": str(e),
                            "scraped_at": datetime.now().isoformat()
                        }
                        return False

        # Process in batches with parallel execution
        async with ProductScraper() as scraper:
            for batch_start in range(0, total_asins, batch_size):
                batch_end = min(batch_start + batch_size, total_asins)
                batch_asins = asins_to_enrich[batch_start:batch_end]

                logger.info(f"\n📦 Processing batch {batch_start // batch_size + 1}/{(total_asins + batch_size - 1) // batch_size} ({batch_start + 1}-{batch_end}/{total_asins})")

                # Process batch in parallel
                tasks = [
                    enrich_single_product(scraper, asin, batch_start + i + 1)
                    for i, asin in enumerate(batch_asins)
                ]
                await asyncio.gather(*tasks)

                # Delay between batches (not between individual products)
                if batch_end < total_asins:
                    logger.debug(f"Batch completed, waiting {delay}s before next batch...")
                    await asyncio.sleep(delay)

                # Progress update
                progress_pct = (batch_end / total_asins) * 100
                logger.info(f"Progress: {progress_pct:.1f}% | Enriched: {enriched_count} | Skipped: {skipped_count} | Failed: {failed_count}")

        # Final summary
        logger.info("\n" + "=" * 60)
        logger.info("Product Enrichment Summary:")
        logger.info(f"  Total products: {total_asins}")
        logger.info(f"  ✓ Enriched: {enriched_count}")
        logger.info(f"  ⊘ Skipped (already have data): {skipped_count}")
        logger.info(f"  ✗ Failed: {failed_count}")
        if total_asins > skipped_count:
            success_rate = (enriched_count / (total_asins - skipped_count)) * 100
            logger.info(f"  Success rate: {success_rate:.1f}%")
        logger.info("=" * 60)

    async def collect_reviews(self):
        """
        Collect reviews for each target product from product detail pages.

        Uses /dp/ASIN page instead of /product-reviews/ to avoid login requirement.
        Collects review summary (rating, count) and top ~10-15 visible reviews.
        """
        target_products = self.products_config["core_products"]
        max_reviews = min(self.products_config["collection_settings"]["reviews_per_product"], 15)

        logger.info(f"Collecting reviews from product detail pages (max {max_reviews} per product)")

        async with ReviewScraper() as scraper:
            for product_config in target_products:
                asin = product_config["asin"]
                logger.info(f"Scraping reviews for: {asin}")

                try:
                    # Navigate to product page once
                    url = f"{scraper.base_url}/dp/{asin}"
                    success = await scraper.goto(url)
                    if not success:
                        logger.error(f"Failed to load product page: {asin}")
                        continue

                    # Wait for main product container
                    await scraper.wait_for_selector("#dp-container", timeout=15000)

                    # Get review summary from product page (already on page)
                    summary = await scraper.scrape_review_summary(asin, navigate=False)

                    # Get reviews visible on product detail page (already on page)
                    reviews = await scraper.scrape_from_product_page(
                        asin,
                        max_reviews=max_reviews,
                        navigate=False
                    )

                    self.collected_data["reviews"][asin] = {
                        "summary": summary,
                        "reviews": reviews,
                        "count": len(reviews),
                    }

                    logger.success(f"✓ Collected {len(reviews)} reviews for {asin} (summary: {summary.get('total_reviews', 'N/A')} total, {summary.get('average_rating', 'N/A')} avg)")

                except Exception as e:
                    logger.error(f"✗ Failed to scrape reviews for {asin}: {e}")

    def save_raw_data(self):
        """Save collected data to JSON files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Save products data
        products_file = DATA_DIR / f"products_{timestamp}.json"
        with open(products_file, "w", encoding="utf-8") as f:
            json.dump(self.collected_data["products"], f, indent=2, ensure_ascii=False)
        logger.info(f"Saved products data: {products_file}")

        # Save rankings data
        ranks_file = DATA_DIR / f"ranks_{timestamp}.json"
        with open(ranks_file, "w", encoding="utf-8") as f:
            json.dump(self.collected_data["ranks"], f, indent=2, ensure_ascii=False)
        logger.info(f"Saved rankings data: {ranks_file}")

        # Save reviews data
        reviews_file = DATA_DIR / f"reviews_{timestamp}.json"
        with open(reviews_file, "w", encoding="utf-8") as f:
            json.dump(self.collected_data["reviews"], f, indent=2, ensure_ascii=False)
        logger.info(f"Saved reviews data: {reviews_file}")

        # NEW: Convert rankings to category_products format for frontend
        # Merge enriched product details into rankings
        category_products = {}
        for category_name, rankings in self.collected_data["ranks"].items():
            # Get category URL from config
            category_url = None
            if category_name in self.categories_config.get("primary_categories", {}):
                category_url = self.categories_config["primary_categories"][category_name]["url"]
            elif category_name in self.categories_config.get("related_categories", {}):
                category_url = self.categories_config["related_categories"][category_name]["url"]

            # Enrich each product in rankings with detailed data
            enriched_products = []
            for product in rankings:
                # Skip if product is not a dict (corrupted data)
                if not isinstance(product, dict):
                    logger.warning(f"Skipping non-dict product in {category_name}: {type(product)}")
                    continue
                asin = product.get("asin")

                # Merge with detailed product data if available
                if asin and asin in self.collected_data["products"]:
                    detailed_data = self.collected_data["products"][asin]

                    # Merge: ranking data takes precedence for rank, rating, review_count
                    # Detailed data provides brand, breadcrumb, images, description, features
                    merged_product = {
                        **detailed_data,  # Start with detailed data
                        **product,  # Override with ranking data (rank, rating from list)
                    }
                    enriched_products.append(merged_product)
                else:
                    # No detailed data available, use ranking data only
                    enriched_products.append(product)

            category_products[category_name] = {
                "category": category_name,
                "url": category_url,
                "success": True,
                "products_count": len(enriched_products),
                "products": enriched_products
            }

        # Save as beauty_rankings_*.json for scheduler data copy
        category_products_file = OUTPUT_DIR / f"beauty_rankings_{timestamp}.json"
        with open(category_products_file, "w", encoding="utf-8") as f:
            json.dump(category_products, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved category products data: {category_products_file}")

        # Also save directly as category_products.json in output folder
        category_products_direct = OUTPUT_DIR / "category_products.json"
        with open(category_products_direct, "w", encoding="utf-8") as f:
            json.dump(category_products, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved category products (direct): {category_products_direct}")

    def generate_m1_data(self):
        """Generate M1 module JSON files"""
        from generators.m1_generator import M1Generator

        m1_gen = M1Generator()

        # Generate breadcrumb traffic
        m1_breadcrumb = m1_gen.generate_breadcrumb_traffic(
            self.collected_data["products"],
            self.collected_data["ranks"]
        )

        # Simulate historical rankings for volatility (MVP: use current data twice)
        historical_rankings = {}
        for category, rankings in self.collected_data["ranks"].items():
            # Simulate 2 snapshots (in real system, collect over time)
            historical_rankings[category] = [rankings, rankings]

        # Generate volatility index
        m1_volatility = m1_gen.generate_volatility_index(
            historical_rankings,
            self.categories_config
        )

        # Generate emerging brands
        m1_emerging = m1_gen.generate_emerging_brands(historical_rankings)

        # Store for M2 intelligence bridge
        self.m1_data = {
            "breadcrumb": m1_breadcrumb,
            "volatility": m1_volatility,
            "emerging": m1_emerging,
        }

    async def generate_m2_data(self):
        """Generate M2 module JSON files"""
        from generators.m2_generator import M2Generator

        m2_gen = M2Generator()

        # Generate usage context
        m2_usage = m2_gen.generate_usage_context(
            self.collected_data["products"],
            self.collected_data["reviews"]
        )

        # Generate intelligence bridge
        if hasattr(self, 'm1_data'):
            m2_intelligence = m2_gen.generate_intelligence_bridge(
                self.m1_data["breadcrumb"],
                self.m1_data["volatility"],
                self.m1_data["emerging"],
                m2_usage
            )
        else:
            logger.warning("M1 data not available for intelligence bridge")

    def print_summary(self):
        """Print collection summary"""
        logger.info("\n📊 Collection Summary:")

        # Count products with detailed info vs basic info only
        products_with_details = 0
        products_basic_only = 0
        for asin, data in self.collected_data["products"].items():
            if data.get("brand") or data.get("breadcrumb"):
                products_with_details += 1
            else:
                products_basic_only += 1

        logger.info(f"  - Products with detailed info: {products_with_details}")
        logger.info(f"  - Categories tracked: {len(self.collected_data['ranks'])}")

        # Count total ranked products
        total_ranked = sum(len(rankings) for rankings in self.collected_data["ranks"].values())
        logger.info(f"  - Total ranked products: {total_ranked}")

        total_reviews = sum(
            data["count"] for data in self.collected_data["reviews"].values()
        )
        logger.info(f"  - Total reviews collected: {total_reviews}")

        # Enrichment statistics
        if products_with_details > 0:
            logger.info(f"\n📈 Product Enrichment:")
            logger.info(f"  - Enriched with detailed info: {products_with_details}/{total_ranked}")
            logger.info(f"  - Enrichment rate: {(products_with_details / total_ranked * 100):.1f}%")

        logger.info("\n📁 Generated Files:")
        logger.info("  Raw Data:")
        logger.info("    - data/products_*.json (detailed product info)")
        logger.info("    - data/ranks_*.json (ranking data)")
        logger.info("    - data/reviews_*.json (review data)")
        logger.info("  Frontend Data:")
        logger.info("    - output/beauty_rankings_*.json (enriched rankings)")
        logger.info("    - output/category_products.json (latest enriched data)")
        logger.info("  M1 Module:")
        logger.info("    - output/m1_breadcrumb_traffic.json")
        logger.info("    - output/m1_volatility_index.json")
        logger.info("    - output/m1_emerging_brands.json")
        logger.info("  M2 Module:")
        logger.info("    - output/m2_usage_context.json")
        logger.info("    - output/m2_intelligence_bridge.json")

        logger.info("\n💡 Next Steps:")
        logger.info("  1. Review generated JSON files in 'output/' folder")
        logger.info("  2. Run data copier to sync to frontend: python utils/data_copier.py")
        logger.info("  3. Refresh dashboard to see enriched Amazon data!")


    async def extract_attributes(self):
        """
        STEP 7: Extract product attributes using Claude API
        """
        import os
        from analyzers import AttributeExtractor

        # Get API key from environment or config
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("WARNING: ANTHROPIC_API_KEY not set, skipping attribute extraction")
            logger.info("To enable: export ANTHROPIC_API_KEY=your_key_here")
            return

        # Get configuration
        claude_config = self.scheduler_config.get("claude_api", {})
        if not claude_config.get("enabled", False):
            logger.info("Claude API disabled in config, skipping attribute extraction")
            return

        # Initialize extractor
        extractor = AttributeExtractor(
            api_key=api_key,
            model=claude_config.get("model", "claude-haiku-4-5-20251001"),
            monthly_budget=claude_config.get("monthly_budget_usd", 150.0)
        )

        # Collect all products with enriched data
        products_to_extract = []
        for asin, product_data in self.collected_data["products"].items():
            # Skip if no meaningful data
            if not product_data.get("brand") and not product_data.get("name"):
                continue

            products_to_extract.append({
                "asin": asin,
                "name": product_data.get("name", "Unknown"),
                "description": product_data.get("description", ""),
                "price": product_data.get("price", ""),
                "breadcrumb": product_data.get("breadcrumb", []),
                "category": product_data.get("breadcrumb", ["Unknown"])[-1] if product_data.get("breadcrumb") else "Unknown"
            })

        if not products_to_extract:
            logger.warning("No products available for attribute extraction")
            return

        logger.info(f"Extracting attributes for {len(products_to_extract)} products...")

        # Extract in batches
        extracted_attributes = await extractor.extract_batch(
            products_to_extract,
            show_progress=True
        )

        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = OUTPUT_DIR / f"product_attributes_{timestamp}.json"
        extractor.save_results(extracted_attributes, output_path)

        # Store in collected data for next step
        self.collected_data["attributes"] = extracted_attributes

        logger.success(f"[OK] Extracted attributes for {len(extracted_attributes)} products")

    async def generate_product_ideas(self):
        """
        STEP 8: Generate AI-powered product ideas based on market gaps
        """
        import os
        from analyzers import IdeationEngine

        # Get API key
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("WARNING: ANTHROPIC_API_KEY not set, skipping product ideation")
            logger.info("To enable: export ANTHROPIC_API_KEY=your_key_here")
            return

        # Check if attributes were extracted
        if "attributes" not in self.collected_data or not self.collected_data["attributes"]:
            logger.warning("No attributes extracted, skipping product ideation")
            logger.info("Run with ANTHROPIC_API_KEY set to enable full AI features")
            return

        # Initialize ideation engine
        logger.info("Initializing AI Product Ideation Engine...")
        engine = IdeationEngine(api_key=api_key)

        # Organize products by category with attributes
        products_by_category = {}

        for category_name, rankings in self.collected_data["ranks"].items():
            enriched_products = []

            # Handle both list and dict formats
            product_list = rankings if isinstance(rankings, list) else rankings.get("products", [])

            for product in product_list:
                asin = product.get("asin")
                if not asin:
                    continue

                # Merge ranking data + detailed data + attributes
                enriched = {**product}

                if asin in self.collected_data["products"]:
                    enriched.update(self.collected_data["products"][asin])

                if asin in self.collected_data["attributes"]:
                    enriched["attributes"] = self.collected_data["attributes"][asin]

                enriched_products.append(enriched)

            if enriched_products:
                products_by_category[category_name] = enriched_products

        logger.info(f"Analyzing {len(products_by_category)} categories for product opportunities...")

        # Generate ideas for top categories (limit to avoid excessive API calls)
        # Focus on categories with most products with attributes
        categories_with_attrs = {}
        for cat_name, products in products_by_category.items():
            products_with_attrs = [p for p in products if p.get("attributes")]
            if len(products_with_attrs) >= 10:  # Minimum 10 products with attributes
                categories_with_attrs[cat_name] = products

        if not categories_with_attrs:
            logger.warning("No categories have sufficient attributed products (min 10)")
            return

        # Select top 10 categories by product count
        top_categories = sorted(
            categories_with_attrs.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:10]

        top_categories_dict = dict(top_categories)

        logger.info(f"Generating ideas for top {len(top_categories_dict)} categories:")
        for cat_name in top_categories_dict.keys():
            logger.info(f"  - {cat_name}")

        # Generate ideas
        ideation_report = await engine.generate_for_all_categories(
            top_categories_dict,
            ideas_per_category=5
        )

        # Save report
        engine.save_report(ideation_report)

        total_ideas = ideation_report['metadata']['total_ideas_generated']
        logger.success(f"[OK] Generated {total_ideas} innovative product ideas!")
        logger.info(f"Report saved to: output/product_ideation_report.json")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Amazon Data Collector - MVP")
    parser.add_argument(
        "--mode",
        choices=["full", "scrape-only", "analyze-only"],
        default="full",
        help="Execution mode"
    )
    args = parser.parse_args()

    pipeline = DataCollectionPipeline()

    if args.mode == "full":
        await pipeline.run_full_pipeline()
    elif args.mode == "scrape-only":
        logger.info("Running scrape-only mode...")
        await pipeline.run_full_pipeline()
    elif args.mode == "analyze-only":
        logger.info("Analyze-only mode not yet implemented")
        logger.info("Please run data collection first")


if __name__ == "__main__":
    asyncio.run(main())
