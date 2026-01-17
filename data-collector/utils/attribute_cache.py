"""
Attribute Cache Manager
Caches extracted product attributes to avoid redundant Claude API calls
"""
import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional
from loguru import logger

from config.settings import DATA_DIR


class AttributeCacheManager:
    """
    Manage cached product attributes with TTL expiration

    Caches attributes for 7 days by default to balance freshness and cost savings.
    Uses ASIN as primary key.
    """

    def __init__(self, cache_dir: Optional[Path] = None, ttl_days: int = 7):
        """
        Initialize attribute cache manager

        Args:
            cache_dir: Directory for cache files (default: DATA_DIR/attribute_cache)
            ttl_days: Cache time-to-live in days (default: 7)
        """
        self.cache_dir = cache_dir or (DATA_DIR / "attribute_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self.ttl_days = ttl_days
        self.ttl_seconds = ttl_days * 24 * 60 * 60

        # In-memory cache for current session
        self._memory_cache: Dict[str, Dict] = {}

        logger.info(f"Attribute cache initialized: {self.cache_dir} (TTL: {ttl_days} days)")

    def _get_cache_file_path(self, asin: str) -> Path:
        """Get cache file path for an ASIN"""
        # Use first 2 characters of ASIN for subdirectory (simple sharding)
        subdir = self.cache_dir / asin[:2].lower()
        subdir.mkdir(exist_ok=True)
        return subdir / f"{asin}.json"

    def get(self, asin: str) -> Optional[Dict]:
        """
        Get cached attributes for an ASIN

        Args:
            asin: Product ASIN

        Returns:
            Dict with attributes or None if not cached/expired
        """
        # Check memory cache first
        if asin in self._memory_cache:
            cached = self._memory_cache[asin]
            if self._is_valid(cached):
                logger.debug(f"Memory cache hit: {asin}")
                return cached["attributes"]

        # Check disk cache
        cache_file = self._get_cache_file_path(asin)

        if not cache_file.exists():
            return None

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)

            # Validate cache entry
            if self._is_valid(cached):
                # Load into memory cache
                self._memory_cache[asin] = cached
                logger.debug(f"Disk cache hit: {asin}")
                return cached["attributes"]
            else:
                # Expired - delete file
                logger.debug(f"Cache expired: {asin}")
                cache_file.unlink(missing_ok=True)
                return None

        except Exception as e:
            logger.warning(f"Failed to read cache for {asin}: {e}")
            return None

    def set(self, asin: str, attributes: Dict, metadata: Optional[Dict] = None):
        """
        Cache attributes for an ASIN

        Args:
            asin: Product ASIN
            attributes: Extracted attributes dict
            metadata: Optional metadata (model, extraction_time, etc.)
        """
        cache_entry = {
            "asin": asin,
            "attributes": attributes,
            "cached_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=self.ttl_days)).isoformat(),
            "metadata": metadata or {}
        }

        # Save to memory cache
        self._memory_cache[asin] = cache_entry

        # Save to disk cache
        cache_file = self._get_cache_file_path(asin)

        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_entry, f, indent=2, ensure_ascii=False)

            logger.debug(f"Cached attributes for {asin}")

        except Exception as e:
            logger.error(f"Failed to cache attributes for {asin}: {e}")

    def _is_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if "expires_at" not in cache_entry:
            return False

        try:
            expires_at = datetime.fromisoformat(cache_entry["expires_at"])
            return datetime.now() < expires_at
        except Exception:
            return False

    def invalidate(self, asin: str):
        """
        Invalidate cache for an ASIN

        Args:
            asin: Product ASIN
        """
        # Remove from memory cache
        if asin in self._memory_cache:
            del self._memory_cache[asin]

        # Remove from disk cache
        cache_file = self._get_cache_file_path(asin)
        cache_file.unlink(missing_ok=True)

        logger.info(f"Invalidated cache for {asin}")

    def clear_expired(self) -> int:
        """
        Clear all expired cache entries

        Returns:
            int: Number of entries cleared
        """
        cleared = 0

        # Clear from memory cache
        expired_asins = [
            asin for asin, entry in self._memory_cache.items()
            if not self._is_valid(entry)
        ]

        for asin in expired_asins:
            del self._memory_cache[asin]
            cleared += 1

        # Clear from disk cache
        for cache_file in self.cache_dir.rglob("*.json"):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    entry = json.load(f)

                if not self._is_valid(entry):
                    cache_file.unlink()
                    cleared += 1

            except Exception as e:
                logger.warning(f"Error checking {cache_file}: {e}")

        if cleared > 0:
            logger.info(f"Cleared {cleared} expired cache entries")

        return cleared

    def clear_all(self):
        """Clear entire cache (use with caution!)"""
        # Clear memory cache
        self._memory_cache.clear()

        # Clear disk cache
        for cache_file in self.cache_dir.rglob("*.json"):
            cache_file.unlink()

        logger.warning("Cleared entire attribute cache")

    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_entries = 0
        valid_entries = 0
        expired_entries = 0
        total_size_bytes = 0

        for cache_file in self.cache_dir.rglob("*.json"):
            total_entries += 1
            total_size_bytes += cache_file.stat().st_size

            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    entry = json.load(f)

                if self._is_valid(entry):
                    valid_entries += 1
                else:
                    expired_entries += 1

            except Exception:
                expired_entries += 1

        return {
            "total_entries": total_entries,
            "valid_entries": valid_entries,
            "expired_entries": expired_entries,
            "memory_cache_size": len(self._memory_cache),
            "total_size_mb": total_size_bytes / (1024 * 1024),
            "cache_ttl_days": self.ttl_days
        }

    def print_stats(self):
        """Print cache statistics"""
        stats = self.get_stats()

        logger.info("=" * 60)
        logger.info("💾 Attribute Cache Statistics")
        logger.info("=" * 60)
        logger.info(f"Total Entries: {stats['total_entries']:,}")
        logger.info(f"Valid Entries: {stats['valid_entries']:,}")
        logger.info(f"Expired Entries: {stats['expired_entries']:,}")
        logger.info(f"Memory Cache Size: {stats['memory_cache_size']:,}")
        logger.info(f"Total Disk Size: {stats['total_size_mb']:.2f} MB")
        logger.info(f"Cache TTL: {stats['cache_ttl_days']} days")
        logger.info("=" * 60)


# Singleton instance
_attribute_cache_instance = None


def get_attribute_cache(ttl_days: int = 7) -> AttributeCacheManager:
    """Get or create attribute cache singleton instance"""
    global _attribute_cache_instance

    if _attribute_cache_instance is None:
        _attribute_cache_instance = AttributeCacheManager(ttl_days=ttl_days)

    return _attribute_cache_instance
