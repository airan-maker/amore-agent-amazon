"""
Demo Data Generator
Generates realistic demo data for missing dates based on existing data
"""
import json
import random
from pathlib import Path
from datetime import datetime, timedelta
from copy import deepcopy
from loguru import logger

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "data-collector" / "output"
FRONTEND_DATA_DIR = PROJECT_ROOT / "app" / "src" / "data"


class DemoDataGenerator:
    """Generates realistic demo data for Amazon product tracking"""

    def __init__(self):
        self.output_dir = OUTPUT_DIR
        self.frontend_data_dir = FRONTEND_DATA_DIR

        # Ensure directories exist
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.frontend_data_dir.mkdir(parents=True, exist_ok=True)

    def load_base_data(self, filename: str) -> dict:
        """Load existing data file as base"""
        filepath = self.frontend_data_dir / filename

        if not filepath.exists():
            logger.error(f"Base data file not found: {filepath}")
            return {}

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        logger.info(f"Loaded base data from: {filename}")
        return data

    def modify_product_data(self, products: list, date: datetime, variance: float = 0.05) -> list:
        """
        Modify product data with realistic changes

        Args:
            products: List of product dictionaries
            date: Target date for the data
            variance: Maximum percentage change for metrics (default 5%)
        """
        modified_products = []

        for product in products:
            modified_product = deepcopy(product)

            # Update scraped_at timestamp
            # Set time to around 3 AM (when scheduler runs)
            target_time = date.replace(hour=3, minute=random.randint(0, 30), second=random.randint(0, 59))
            modified_product["scraped_at"] = target_time.isoformat()

            # Modify review count (can increase or decrease slightly)
            if "review_count" in modified_product and modified_product["review_count"]:
                review_count = modified_product["review_count"]
                # Reviews usually increase, but can have small fluctuations
                change = random.uniform(-variance * 0.2, variance * 2)  # -1% to +10%
                new_count = int(review_count * (1 + change))
                modified_product["review_count"] = max(new_count, review_count)  # Never decrease much

            # Modify rating slightly (very small changes)
            if "rating" in modified_product and modified_product["rating"]:
                rating = modified_product["rating"]
                # Ratings change very slowly
                change = random.uniform(-0.1, 0.1)  # ±0.1
                new_rating = round(rating + change, 1)
                # Keep in valid range
                modified_product["rating"] = max(1.0, min(5.0, new_rating))

            # Occasionally shuffle ranks slightly (±1-3 positions)
            if "rank" in modified_product and modified_product["rank"]:
                if random.random() < 0.3:  # 30% chance of rank change
                    rank_change = random.randint(-3, 3)
                    new_rank = modified_product["rank"] + rank_change
                    modified_product["rank"] = max(1, new_rank)

            modified_products.append(modified_product)

        return modified_products

    def modify_category_data(self, data: dict, date: datetime) -> dict:
        """Modify category products data"""
        modified_data = deepcopy(data)

        for category_name, category_info in modified_data.items():
            if "products" in category_info:
                category_info["products"] = self.modify_product_data(
                    category_info["products"],
                    date
                )

        return modified_data

    def modify_m1_breadcrumb(self, data: dict, date: datetime) -> dict:
        """Modify M1 breadcrumb traffic data"""
        modified_data = deepcopy(data)

        # Update timestamp
        modified_data["generated_at"] = date.isoformat()

        # Slightly modify traffic estimates
        if "categories" in modified_data:
            for category in modified_data["categories"]:
                if "estimated_traffic" in category:
                    variance = random.uniform(0.95, 1.05)  # ±5%
                    category["estimated_traffic"] = int(category["estimated_traffic"] * variance)

        return modified_data

    def modify_m1_volatility(self, data: dict, date: datetime) -> dict:
        """Modify M1 volatility index data"""
        modified_data = deepcopy(data)

        # Update timestamp
        modified_data["generated_at"] = date.isoformat()

        # Slightly modify volatility scores
        if "categories" in modified_data:
            for category in modified_data["categories"]:
                if "volatility_score" in category:
                    # Volatility can fluctuate more
                    variance = random.uniform(0.8, 1.2)  # ±20%
                    category["volatility_score"] = round(category["volatility_score"] * variance, 2)

        return modified_data

    def modify_m1_emerging_brands(self, data: dict, date: datetime) -> dict:
        """Modify M1 emerging brands data"""
        modified_data = deepcopy(data)

        # Update timestamp
        modified_data["generated_at"] = date.isoformat()

        # Slightly modify rank improvements
        if "brands" in modified_data:
            for brand in modified_data["brands"]:
                if "rank_improvement" in brand:
                    # Improvements can vary
                    change = random.randint(-2, 5)
                    brand["rank_improvement"] = max(0, brand["rank_improvement"] + change)

        return modified_data

    def modify_m2_usage_context(self, data: dict, date: datetime) -> dict:
        """Modify M2 usage context data"""
        modified_data = deepcopy(data)

        # Update timestamp
        modified_data["generated_at"] = date.isoformat()

        # M2 data is AI-generated, so minimal changes
        return modified_data

    def modify_m2_intelligence_bridge(self, data: dict, date: datetime) -> dict:
        """Modify M2 intelligence bridge data"""
        modified_data = deepcopy(data)

        # Update timestamp
        modified_data["generated_at"] = date.isoformat()

        return modified_data

    def generate_demo_data_for_date(self, target_date: datetime):
        """Generate complete demo data set for a specific date"""
        logger.info("=" * 70)
        logger.info(f"Generating demo data for: {target_date.strftime('%Y-%m-%d')}")
        logger.info("=" * 70)

        date_str = target_date.strftime("%Y%m%d")
        timestamp_str = target_date.strftime("%Y%m%d_%H%M%S")

        # 1. Category products
        logger.info("\n[1/6] Generating category_products...")
        base_data = self.load_base_data("category_products.json")
        if base_data:
            modified_data = self.modify_category_data(base_data, target_date)
            output_file = self.output_dir / f"test_5_categories_{timestamp_str}.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Generated: {output_file.name}")

        # 2. M1 Breadcrumb Traffic
        logger.info("\n[2/6] Generating m1_breadcrumb_traffic...")
        base_data = self.load_base_data("m1_breadcrumb_traffic.json")
        if base_data:
            modified_data = self.modify_m1_breadcrumb(base_data, target_date)
            output_file = self.output_dir / "m1_breadcrumb_traffic.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Updated: {output_file.name}")

        # 3. M1 Volatility Index
        logger.info("\n[3/6] Generating m1_volatility_index...")
        base_data = self.load_base_data("m1_volatility_index.json")
        if base_data:
            modified_data = self.modify_m1_volatility(base_data, target_date)
            output_file = self.output_dir / "m1_volatility_index.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Updated: {output_file.name}")

        # 4. M1 Emerging Brands
        logger.info("\n[4/6] Generating m1_emerging_brands...")
        base_data = self.load_base_data("m1_emerging_brands.json")
        if base_data:
            modified_data = self.modify_m1_emerging_brands(base_data, target_date)
            output_file = self.output_dir / "m1_emerging_brands.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Updated: {output_file.name}")

        # 5. M2 Usage Context
        logger.info("\n[5/6] Generating m2_usage_context...")
        base_data = self.load_base_data("m2_usage_context.json")
        if base_data:
            modified_data = self.modify_m2_usage_context(base_data, target_date)
            output_file = self.output_dir / "m2_usage_context.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Updated: {output_file.name}")

        # 6. M2 Intelligence Bridge
        logger.info("\n[6/6] Generating m2_intelligence_bridge...")
        base_data = self.load_base_data("m2_intelligence_bridge.json")
        if base_data:
            modified_data = self.modify_m2_intelligence_bridge(base_data, target_date)
            output_file = self.output_dir / "m2_intelligence_bridge.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(modified_data, f, indent=2, ensure_ascii=False)
            logger.success(f"✓ Updated: {output_file.name}")

        logger.success("\n" + "=" * 70)
        logger.success(f"✅ Demo data generation completed for {target_date.strftime('%Y-%m-%d')}")
        logger.success("=" * 70)


def main():
    """Generate demo data for missing dates"""
    generator = DemoDataGenerator()

    # Generate demo data for 2026-01-02
    date_2026_01_02 = datetime(2026, 1, 2, 3, 15, 0)
    generator.generate_demo_data_for_date(date_2026_01_02)

    print("\n\n")

    # Generate demo data for 2026-01-03
    date_2026_01_03 = datetime(2026, 1, 3, 3, 20, 0)
    generator.generate_demo_data_for_date(date_2026_01_03)

    print("\n\n")
    logger.info("=" * 70)
    logger.info("📋 Next Steps:")
    logger.info("=" * 70)
    logger.info("1. Copy generated files to frontend:")
    logger.info("   python data-collector/utils/data_copier.py")
    logger.info("")
    logger.info("2. Or use the batch file:")
    logger.info("   copy_data_to_frontend.bat")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
