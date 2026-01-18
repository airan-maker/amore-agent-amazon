"""
Auto Competitor Selector
Dynamically selects competitor products based on market data

Hybrid Selection Strategy:
1. Core Products (Fixed): Always track from products.yaml
2. Dynamic Competitors (Auto): Automatically identify based on rankings
"""
import yaml
from typing import Dict, List, Set, Any
from pathlib import Path
from loguru import logger

from config.settings import CONFIG_DIR


class AutoCompetitorSelector:
    """
    Automatically selects target products for Brand Intelligence analysis
    """

    def __init__(self):
        self.config_path = CONFIG_DIR / "products.yaml"
        self.config = self._load_config()

    def _load_config(self) -> Dict:
        """Load products configuration"""
        with open(self.config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        return config

    def get_core_asins(self) -> Set[str]:
        """
        Get core product ASINs (always track)

        Returns:
            Set of core ASINs
        """
        core_asins = set()

        for product in self.config.get("core_products", []):
            asin = product.get("asin")
            if asin:
                core_asins.add(asin)

        logger.info(f"Loaded {len(core_asins)} core products (always track)")
        return core_asins

    def get_laneige_products(self) -> Dict[str, Dict]:
        """
        Get LANEIGE products info

        Returns:
            Dict of LANEIGE ASINs -> product info
        """
        laneige_products = {}

        for product in self.config.get("core_products", []):
            if product.get("brand") == "LANEIGE":
                asin = product.get("asin")
                laneige_products[asin] = product

        logger.info(f"Found {len(laneige_products)} LANEIGE products")
        return laneige_products

    def select_dynamic_competitors(
        self,
        rankings_data: Dict[str, List[Dict]],
        products_data: Dict[str, Dict]
    ) -> Set[str]:
        """
        Dynamically select competitor products based on rankings

        Args:
            rankings_data: Category rankings {category_name: [products]}
            products_data: Product details {asin: product_data}

        Returns:
            Set of dynamically selected ASINs
        """
        rules = self.config.get("auto_selection_rules", {})

        categories_to_track = rules.get("categories_to_track", [])
        top_n = rules.get("top_n_per_category", 20)
        price_threshold = rules.get("price_similarity_threshold", 0.3)
        min_review_count = rules.get("min_review_count", 100)
        min_rating = rules.get("min_rating", 3.5)

        logger.info(f"\nDynamic Competitor Selection Rules:")
        logger.info(f"  Categories: {categories_to_track}")
        logger.info(f"  Top N per category: {top_n}")
        logger.info(f"  Price similarity: ±{price_threshold * 100}%")
        logger.info(f"  Min reviews: {min_review_count}")
        logger.info(f"  Min rating: {min_rating}")

        # Get LANEIGE products for price comparison
        laneige_products = self.get_laneige_products()
        laneige_price_range = self._get_laneige_price_range(laneige_products, products_data)

        dynamic_asins = set()

        # Process each tracked category
        for category in categories_to_track:
            if category not in rankings_data:
                logger.warning(f"  Category '{category}' not found in rankings")
                continue

            logger.info(f"\n  Processing category: {category}")

            category_products = rankings_data[category][:top_n]  # Top N
            selected_count = 0

            for product in category_products:
                asin = product.get("asin")
                if not asin or asin not in products_data:
                    continue

                product_data = products_data[asin]

                # Apply filters
                if not self._passes_filters(
                    product_data,
                    laneige_price_range,
                    price_threshold,
                    min_review_count,
                    min_rating
                ):
                    continue

                dynamic_asins.add(asin)
                selected_count += 1

            logger.info(f"    Selected {selected_count} products from {category}")

        logger.success(f"\n✓ Dynamically selected {len(dynamic_asins)} competitor products")
        return dynamic_asins

    def _get_laneige_price_range(
        self,
        laneige_products: Dict[str, Dict],
        products_data: Dict[str, Dict]
    ) -> tuple:
        """
        Get LANEIGE price range

        Returns:
            (min_price, max_price) tuple
        """
        prices = []

        for asin in laneige_products.keys():
            if asin in products_data:
                price = products_data[asin].get("price")
                if price and isinstance(price, (int, float)):
                    prices.append(price)

        if not prices:
            logger.warning("Could not determine LANEIGE price range")
            return (0, 999999)  # Accept all prices

        min_price = min(prices)
        max_price = max(prices)

        logger.info(f"  LANEIGE price range: ${min_price:.2f} - ${max_price:.2f}")
        return (min_price, max_price)

    def _passes_filters(
        self,
        product_data: Dict,
        laneige_price_range: tuple,
        price_threshold: float,
        min_review_count: int,
        min_rating: float
    ) -> bool:
        """
        Check if product passes all filters

        Args:
            product_data: Product details
            laneige_price_range: (min, max) LANEIGE prices
            price_threshold: Price similarity threshold (0.3 = ±30%)
            min_review_count: Minimum review count
            min_rating: Minimum rating

        Returns:
            True if passes all filters
        """
        # Check review count
        review_count = product_data.get("review_count", 0)
        if review_count is None:
            review_count = 0
        elif isinstance(review_count, str):
            review_count = int(review_count.replace(",", "")) if review_count else 0

        if review_count < min_review_count:
            return False

        # Check rating
        rating = product_data.get("rating", 0)
        if rating is None:
            rating = 0
        elif isinstance(rating, str):
            rating = float(rating) if rating else 0

        if rating < min_rating:
            return False

        # Check price similarity
        price = product_data.get("price")
        if not price or not isinstance(price, (int, float)):
            # If no price info, skip price filter
            return True

        laneige_min, laneige_max = laneige_price_range

        # Calculate acceptable price range (LANEIGE ± threshold%)
        acceptable_min = laneige_min * (1 - price_threshold)
        acceptable_max = laneige_max * (1 + price_threshold)

        if not (acceptable_min <= price <= acceptable_max):
            return False

        return True

    def get_all_target_asins(
        self,
        rankings_data: Dict[str, List[Dict]],
        products_data: Dict[str, Dict]
    ) -> Set[str]:
        """
        Get all target ASINs (core + dynamic)

        Args:
            rankings_data: Category rankings
            products_data: Product details

        Returns:
            Set of all target ASINs for analysis
        """
        logger.info("=" * 60)
        logger.info("Target Product Selection (Hybrid)")
        logger.info("=" * 60)

        # 1. Get core products (fixed)
        core_asins = self.get_core_asins()

        # 2. Get dynamic competitors
        dynamic_asins = self.select_dynamic_competitors(rankings_data, products_data)

        # 3. Combine (remove duplicates)
        all_target_asins = core_asins | dynamic_asins

        # 4. Filter out products not in collected data
        available_asins = all_target_asins & set(products_data.keys())
        missing_asins = all_target_asins - available_asins

        if missing_asins:
            logger.warning(f"\n⚠ {len(missing_asins)} target products not in collected data:")
            for asin in list(missing_asins)[:5]:
                logger.warning(f"    - {asin}")
            if len(missing_asins) > 5:
                logger.warning(f"    ... and {len(missing_asins) - 5} more")

        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("Target Selection Summary")
        logger.info("=" * 60)
        logger.info(f"Core products (fixed): {len(core_asins)}")
        logger.info(f"Dynamic competitors: {len(dynamic_asins)}")
        logger.info(f"Total unique targets: {len(all_target_asins)}")
        logger.info(f"Available in data: {len(available_asins)}")
        logger.info(f"Missing: {len(missing_asins)}")
        logger.info("=" * 60)

        return available_asins

    def save_selection_report(
        self,
        all_asins: Set[str],
        core_asins: Set[str],
        dynamic_asins: Set[str],
        products_data: Dict[str, Dict],
        output_path: Path
    ):
        """
        Save target selection report

        Args:
            all_asins: All selected ASINs
            core_asins: Core ASINs
            dynamic_asins: Dynamic ASINs
            products_data: Product details
            output_path: Output file path
        """
        from datetime import datetime

        report = {
            "generated_at": datetime.now().isoformat(),
            "selection_method": "hybrid",
            "summary": {
                "total_targets": len(all_asins),
                "core_products": len(core_asins),
                "dynamic_competitors": len(dynamic_asins)
            },
            "core_products": [],
            "dynamic_competitors": []
        }

        # Add core products
        for asin in core_asins:
            if asin in products_data:
                product = products_data[asin]
                report["core_products"].append({
                    "asin": asin,
                    "brand": product.get("brand"),
                    "product_name": product.get("product_name"),
                    "selection": "core (always tracked)"
                })

        # Add dynamic competitors
        for asin in dynamic_asins:
            if asin in products_data:
                product = products_data[asin]
                report["dynamic_competitors"].append({
                    "asin": asin,
                    "brand": product.get("brand"),
                    "product_name": product.get("product_name"),
                    "price": product.get("price"),
                    "rating": product.get("rating"),
                    "review_count": product.get("review_count"),
                    "selection": "dynamic (auto-selected)"
                })

        # Save report
        import json
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        logger.info(f"\n✓ Saved selection report: {output_path}")


# Example usage
if __name__ == "__main__":
    selector = AutoCompetitorSelector()

    # Example: Load some sample data
    # In real use, this would come from Stage 1/2 collection
    sample_rankings = {
        "Lip Care": [
            {"asin": "B0054LHI5A", "rank": 1},
            {"asin": "B06XDCPYYL", "rank": 2},
            # ... more products
        ],
        "Face Moisturizers": [
            {"asin": "B0B2RM68G2", "rank": 1},
            # ... more products
        ]
    }

    sample_products = {
        "B0054LHI5A": {
            "brand": "Burt's Bees",
            "product_name": "Lip Balm",
            "price": 4.99,
            "rating": 4.5,
            "review_count": 50000
        },
        # ... more products
    }

    # Get all target ASINs
    target_asins = selector.get_all_target_asins(sample_rankings, sample_products)
    logger.info(f"\nFinal target ASINs: {len(target_asins)}")
