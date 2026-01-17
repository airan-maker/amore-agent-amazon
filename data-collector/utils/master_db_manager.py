"""
Master Database Manager
Provides utilities for loading, querying, and updating ASIN-based master databases
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
from loguru import logger

from config.settings import DATA_DIR


class MasterDBManager:
    """
    Manages ASIN-based master databases for products and reviews
    """

    def __init__(self, master_dir: Path = None):
        """
        Initialize master DB manager

        Args:
            master_dir: Path to master database directory (default: data/master)
        """
        self.master_dir = master_dir or (DATA_DIR / "master")
        self.products_path = self.master_dir / "products_master.json"
        self.reviews_path = self.master_dir / "reviews_master.json"
        self.metadata_path = self.master_dir / "collection_metadata.json"

        self.products_master: Dict[str, Any] = {}
        self.reviews_master: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}

    def load(self):
        """Load master databases from disk"""
        logger.info("Loading master databases...")

        if self.products_path.exists():
            with open(self.products_path, "r", encoding="utf-8") as f:
                self.products_master = json.load(f)
            logger.info(f"  ✓ Loaded {len(self.products_master)} products")
        else:
            logger.warning("  ⚠ products_master.json not found")

        if self.reviews_path.exists():
            with open(self.reviews_path, "r", encoding="utf-8") as f:
                self.reviews_master = json.load(f)
            logger.info(f"  ✓ Loaded {len(self.reviews_master)} review sets")
        else:
            logger.warning("  ⚠ reviews_master.json not found")

        if self.metadata_path.exists():
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            logger.info(f"  ✓ Loaded metadata")
        else:
            logger.warning("  ⚠ collection_metadata.json not found")

        return self

    def save(self):
        """Save master databases to disk"""
        logger.info("Saving master databases...")

        # Create directory if it doesn't exist
        self.master_dir.mkdir(exist_ok=True)

        with open(self.products_path, "w", encoding="utf-8") as f:
            json.dump(self.products_master, f, indent=2, ensure_ascii=False)
        logger.info(f"  ✓ Saved products: {len(self.products_master)} ASINs")

        with open(self.reviews_path, "w", encoding="utf-8") as f:
            json.dump(self.reviews_master, f, indent=2, ensure_ascii=False)
        logger.info(f"  ✓ Saved reviews: {len(self.reviews_master)} ASINs")

        with open(self.metadata_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        logger.info(f"  ✓ Saved metadata")

    def get_all_asins(self) -> Set[str]:
        """Get all ASINs in master database"""
        return set(self.products_master.keys())

    def get_product(self, asin: str) -> Optional[Dict]:
        """Get product data for a specific ASIN"""
        if asin in self.products_master:
            return self.products_master[asin]["data"]
        return None

    def get_reviews(self, asin: str) -> List[Dict]:
        """Get reviews for a specific ASIN"""
        if asin in self.reviews_master:
            return self.reviews_master[asin]["reviews"]
        return []

    def get_stale_asins(self, days_threshold: int = 30) -> List[str]:
        """
        Get ASINs that need refresh (older than threshold)

        Args:
            days_threshold: Number of days after which data is considered stale

        Returns:
            List of stale ASINs
        """
        stale_asins = []
        now = datetime.now()

        for asin, data in self.products_master.items():
            last_updated = datetime.fromisoformat(data["last_updated"])
            days_old = (now - last_updated).days

            if days_old >= days_threshold:
                stale_asins.append(asin)

        logger.info(f"Found {len(stale_asins)} stale ASINs (≥{days_threshold} days)")
        return stale_asins

    def get_missing_asins(self, all_asins: Set[str]) -> Set[str]:
        """
        Get ASINs that are not in master database

        Args:
            all_asins: Set of all ASINs (e.g., from latest rankings)

        Returns:
            Set of missing ASINs
        """
        existing_asins = self.get_all_asins()
        missing = all_asins - existing_asins

        logger.info(f"Found {len(missing)} new ASINs not in master DB")
        return missing

    def update_product(self, asin: str, product_data: Dict):
        """
        Update or add product to master database

        Args:
            asin: Product ASIN
            product_data: Product details
        """
        now = datetime.now().isoformat()

        if asin in self.products_master:
            # Update existing
            self.products_master[asin]["last_updated"] = now
            self.products_master[asin]["update_count"] += 1
            self.products_master[asin]["data"] = product_data
            self.products_master[asin]["brand"] = product_data.get("brand")
            self.products_master[asin]["product_name"] = product_data.get("product_name")
        else:
            # Add new
            self.products_master[asin] = {
                "asin": asin,
                "brand": product_data.get("brand"),
                "product_name": product_data.get("product_name"),
                "first_collected": now,
                "last_updated": now,
                "update_count": 1,
                "data": product_data
            }

    def update_reviews(self, asin: str, reviews: List[Dict]):
        """
        Update or add reviews to master database

        Args:
            asin: Product ASIN
            reviews: List of review dictionaries
        """
        now = datetime.now().isoformat()

        if asin in self.reviews_master:
            # Update existing
            self.reviews_master[asin]["last_updated"] = now
            self.reviews_master[asin]["update_count"] += 1
            self.reviews_master[asin]["reviews"] = reviews
            self.reviews_master[asin]["count"] = len(reviews)
        else:
            # Add new
            self.reviews_master[asin] = {
                "asin": asin,
                "first_collected": now,
                "last_updated": now,
                "update_count": 1,
                "reviews": reviews,
                "count": len(reviews)
            }

    def update_metadata(self, full_refresh: bool = False):
        """
        Update collection metadata

        Args:
            full_refresh: Whether this was a full refresh
        """
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")

        if full_refresh:
            self.metadata["last_full_refresh"] = today
            next_refresh = now + timedelta(days=30)
            self.metadata["next_full_refresh"] = next_refresh.strftime("%Y-%m-%d")

        # Update total count
        self.metadata["total_asins"] = len(self.products_master)

        # Calculate fresh vs stale
        fresh_count = 0
        stale_count = 0

        for asin, data in self.products_master.items():
            last_updated = datetime.fromisoformat(data["last_updated"])
            days_old = (now - last_updated).days
            if days_old < 30:
                fresh_count += 1
            else:
                stale_count += 1

        self.metadata["asins_by_status"] = {
            "fresh": fresh_count,
            "stale": stale_count
        }

    def get_products_dict(self) -> Dict[str, Dict]:
        """
        Get all products as a simple ASIN -> data dictionary
        (For compatibility with existing M1/M2 generators)
        """
        return {
            asin: entry["data"]
            for asin, entry in self.products_master.items()
        }

    def get_reviews_dict(self) -> Dict[str, Dict]:
        """
        Get all reviews as a simple ASIN -> reviews dictionary
        (For compatibility with existing M1/M2 generators)
        """
        return {
            asin: {
                "reviews": entry["reviews"],
                "count": entry["count"]
            }
            for asin, entry in self.reviews_master.items()
        }

    def print_stats(self):
        """Print master database statistics"""
        logger.info("\n" + "=" * 60)
        logger.info("Master Database Statistics")
        logger.info("=" * 60)
        logger.info(f"Total ASINs: {len(self.products_master)}")
        logger.info(f"Total review sets: {len(self.reviews_master)}")

        if self.metadata:
            logger.info(f"\nMetadata:")
            logger.info(f"  Last full refresh: {self.metadata.get('last_full_refresh', 'N/A')}")
            logger.info(f"  Next full refresh: {self.metadata.get('next_full_refresh', 'N/A')}")
            logger.info(f"  Fresh ASINs: {self.metadata.get('asins_by_status', {}).get('fresh', 0)}")
            logger.info(f"  Stale ASINs: {self.metadata.get('asins_by_status', {}).get('stale', 0)}")

        logger.info("=" * 60)


# Example usage
if __name__ == "__main__":
    # Load master DB
    manager = MasterDBManager()
    manager.load()

    # Print stats
    manager.print_stats()

    # Get all ASINs
    all_asins = manager.get_all_asins()
    logger.info(f"\nTotal ASINs: {len(all_asins)}")

    # Get stale ASINs (older than 30 days)
    stale = manager.get_stale_asins(days_threshold=30)
    logger.info(f"Stale ASINs: {len(stale)}")

    # Example: Check for new ASINs
    sample_new_asins = {"B07XXPHQZK", "NEW123456", "NEW789012"}
    missing = manager.get_missing_asins(sample_new_asins)
    logger.info(f"Missing ASINs: {missing}")
