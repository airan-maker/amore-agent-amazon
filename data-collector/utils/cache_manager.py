"""
Cache Manager for Product Data
Caches scraped product data to avoid redundant API calls
"""
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict
from loguru import logger


class CacheManager:
    """Manages caching of scraped product data"""

    def __init__(self, cache_dir: Path, cache_ttl_hours: int = 24):
        """
        Initialize cache manager

        Args:
            cache_dir: Directory to store cache files
            cache_ttl_hours: Cache time-to-live in hours (default: 24h)
        """
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(exist_ok=True, parents=True)
        self.cache_file = cache_dir / "products_cache.json"
        self.cache_ttl = timedelta(hours=cache_ttl_hours)
        self.cache_data = self._load_cache()

    def _load_cache(self) -> Dict:
        """Load cache from file"""
        if not self.cache_file.exists():
            return {}

        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                logger.debug(f"Loaded cache with {len(cache_data)} entries")
                return cache_data
        except Exception as e:
            logger.warning(f"Failed to load cache: {e}")
            return {}

    def _save_cache(self):
        """Save cache to file"""
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.cache_data, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved cache with {len(self.cache_data)} entries")
        except Exception as e:
            logger.error(f"Failed to save cache: {e}")

    def get(self, asin: str) -> Optional[Dict]:
        """
        Get cached product data if available and not expired

        Args:
            asin: Product ASIN

        Returns:
            Cached product data or None if not available/expired
        """
        if asin not in self.cache_data:
            return None

        cached_entry = self.cache_data[asin]
        cached_at = datetime.fromisoformat(cached_entry["cached_at"])

        # Check if cache is still valid
        if datetime.now() - cached_at > self.cache_ttl:
            logger.debug(f"Cache expired for {asin}")
            return None

        logger.debug(f"Cache hit for {asin} (cached {(datetime.now() - cached_at).seconds // 3600}h ago)")
        return cached_entry["data"]

    def set(self, asin: str, data: Dict):
        """
        Store product data in cache

        Args:
            asin: Product ASIN
            data: Product data to cache
        """
        self.cache_data[asin] = {
            "data": data,
            "cached_at": datetime.now().isoformat()
        }
        self._save_cache()
        logger.debug(f"Cached data for {asin}")

    def clear_expired(self):
        """Remove expired entries from cache"""
        now = datetime.now()
        expired_asins = []

        for asin, entry in self.cache_data.items():
            cached_at = datetime.fromisoformat(entry["cached_at"])
            if now - cached_at > self.cache_ttl:
                expired_asins.append(asin)

        for asin in expired_asins:
            del self.cache_data[asin]

        if expired_asins:
            self._save_cache()
            logger.info(f"Cleared {len(expired_asins)} expired cache entries")

    def clear_all(self):
        """Clear all cache entries"""
        self.cache_data = {}
        self._save_cache()
        logger.info("Cleared all cache entries")

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        now = datetime.now()
        valid_count = 0
        expired_count = 0

        for entry in self.cache_data.values():
            cached_at = datetime.fromisoformat(entry["cached_at"])
            if now - cached_at <= self.cache_ttl:
                valid_count += 1
            else:
                expired_count += 1

        return {
            "total_entries": len(self.cache_data),
            "valid_entries": valid_count,
            "expired_entries": expired_count,
            "cache_ttl_hours": self.cache_ttl.total_seconds() / 3600
        }
