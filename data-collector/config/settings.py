"""
Global settings for Amazon Data Collector
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"
OUTPUT_DIR = PROJECT_ROOT / "output"

# Create directories if they don't exist
for directory in [DATA_DIR, LOGS_DIR, OUTPUT_DIR]:
    directory.mkdir(exist_ok=True)

# API Keys
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Amazon Settings
# User-Agent Pool for Bot Detection Evasion (20 different agents)
USER_AGENTS_POOL = [
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    
    # Chrome on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    
    # Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
    
    # Firefox on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0",
    
    # Edge on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    
    # Safari on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
    
    # Chrome on Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    
    # Firefox on Linux
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

AMAZON_SETTINGS = {
    "base_url": "https://www.amazon.com",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "accept_language": "en-US,en;q=0.9",
    "timeout": 30,  # seconds
}

# Scraping Settings
SCRAPER_SETTINGS = {
    "headless": True,  # Run browser in headless mode
    "delay_min": 8,    # Minimum delay between requests (seconds) - INCREASED for bot evasion
    "delay_max": 18,   # Maximum delay between requests (seconds) - INCREASED for bot evasion
    "max_retries": 5,  # Max retry attempts on failure
    "retry_delay": 25, # Delay between retries (seconds) - INCREASED
    "viewport": {"width": 1920, "height": 1080},  # Will be randomized at runtime
    "user_data_dir": str(DATA_DIR / "browser_profile"),  # Persistent browser profile

    # Category-level delays (to avoid being flagged)
    "category_delay_min": 45,  # Minimum delay between categories (seconds) - INCREASED
    "category_delay_max": 90,  # Maximum delay between categories (seconds) - INCREASED

    # Page load timeouts
    "page_load_timeout": 90,  # Page load timeout (seconds)
    "element_wait_timeout": 45,  # Element wait timeout (seconds)

    # Session rotation (restart browser after N requests to avoid fingerprinting)
    "session_rotation_interval": 40,  # Rotate session every ~40 requests
    "session_rotation_jitter": 15,    # Random variance (+/- N requests)

    # Long pause settings (simulate coffee break / distraction)
    "long_pause_probability": 0.08,   # 8% chance of long pause
    "long_pause_min": 180,            # Minimum long pause (3 minutes)
    "long_pause_max": 420,            # Maximum long pause (7 minutes)

    # Time-of-day awareness (slower during off-peak hours)
    "peak_hours_start": 8,    # 8 AM (US timezone)
    "peak_hours_end": 23,     # 11 PM (US timezone)
    "off_peak_delay_multiplier": 1.8,  # 80% slower during off-peak

    # Cookies persistence
    "cookies_file": str(DATA_DIR / "cookies" / "amazon_session.json"),
    "save_cookies": True,
}

# Randomized viewport sizes (to mimic different devices/users)
VIEWPORT_POOL = [
    {"width": 1920, "height": 1080},  # Full HD
    {"width": 1680, "height": 1050},  # WSXGA+
    {"width": 1600, "height": 900},   # HD+
    {"width": 1440, "height": 900},   # WXGA+
    {"width": 1366, "height": 768},   # HD Common Laptop
    {"width": 1536, "height": 864},   # Common Laptop
    {"width": 2560, "height": 1440},  # QHD
]

# Randomized timezone pool (US timezones - valid IANA timezone IDs)
TIMEZONE_POOL = [
    "America/New_York",      # EST
    "America/Chicago",       # CST
    "America/Denver",        # MST
    "America/Los_Angeles",   # PST (includes Seattle, San Francisco)
    "America/Phoenix",       # MST (no DST)
    "America/Anchorage",     # AKST (Alaska)
]

# Randomized locale pool
LOCALE_POOL = [
    "en-US",
    "en-GB",
]

# Rate Limiting
RATE_LIMIT = {
    "requests_per_minute": 15,  # Conservative rate limit
    "requests_per_hour": 200,
    "cool_down_period": 300,    # Cool down for 5 minutes if rate limited
}

# Claude API Settings
CLAUDE_SETTINGS = {
    "model": "claude-haiku-4-5-20251001",  # Fast and cost-effective
    "max_tokens": 4096,
    "temperature": 0.3,  # Lower temperature for more consistent analysis
    "timeout": 60,       # API timeout in seconds
}

# Review Analysis Settings
REVIEW_ANALYSIS = {
    "batch_size": 50,           # Reviews per Claude API call
    "min_review_length": 20,    # Minimum characters
    "max_reviews_per_product": 100,  # MVP limit
    "languages": ["en"],        # English only for MVP
    "sentiment_threshold": 0.5, # Neutral threshold
}

# M1 Data Generation Settings
M1_SETTINGS = {
    "traffic_estimation_method": "inverse_rank",  # inverse_rank, review_velocity, hybrid
    "volatility_window_days": 7,
    "min_rank_for_traffic": 100,  # Only consider products ranked 1-100
    "emerging_brand_lookback_days": 60,
}

# M2 Data Generation Settings
M2_SETTINGS = {
    "min_cluster_size": 10,      # Minimum reviews per usage context
    "max_contexts_per_product": 5,
    "key_phrases_count": 5,
    "sample_reviews_per_context": 3,
}

# Database Settings
DATABASE_SETTINGS = {
    "type": "sqlite",  # MVP uses SQLite
    "path": str(DATA_DIR / "amazon_data.db"),
    "echo": False,     # Set to True for SQL debugging
}

# Logging Settings
LOGGING = {
    "level": "INFO",   # DEBUG, INFO, WARNING, ERROR
    "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    "rotation": "10 MB",
    "retention": "1 week",
    "log_file": str(LOGS_DIR / "collector_{time}.log"),
}

# Output Settings
OUTPUT_SETTINGS = {
    "indent": 2,        # JSON indentation
    "ensure_ascii": False,  # Allow Unicode characters (Korean)
    "date_format": "%Y-%m-%d",
}

# Proxy Settings (Optional - for scaling)
PROXY_SETTINGS = {
    "enabled": False,   # MVP doesn't use proxy
    "provider": None,   # "scraperapi", "brightdata", etc.
    "api_key": os.getenv("PROXY_API_KEY", ""),
}

# Feature Flags
FEATURES = {
    "enable_screenshots": False,  # Save screenshots for debugging
    "enable_caching": True,       # Cache scraped data
    "enable_parallel_scraping": False,  # MVP uses sequential scraping
    "dry_run": False,  # Test mode without actual API calls
}

# Validation Rules
VALIDATION = {
    "min_reviews_for_analysis": 10,
    "max_price_usd": 1000,  # Sanity check
    "valid_ratings": [1, 2, 3, 4, 5],
    "required_fields": {
        "product": ["asin", "brand", "product_name", "price"],
        "review": ["text", "rating", "date"],
        "rank": ["rank", "category", "timestamp"],
    }
}

# Development Settings
DEV_MODE = os.getenv("DEV_MODE", "False").lower() == "true"

if DEV_MODE:
    SCRAPER_SETTINGS["headless"] = False
    SCRAPER_SETTINGS["delay_min"] = 1
    SCRAPER_SETTINGS["delay_max"] = 2
    LOGGING["level"] = "DEBUG"
    FEATURES["enable_screenshots"] = True

# Export all settings
__all__ = [
    "PROJECT_ROOT",
    "CONFIG_DIR",
    "DATA_DIR",
    "LOGS_DIR",
    "OUTPUT_DIR",
    "ANTHROPIC_API_KEY",
    "AMAZON_SETTINGS",
    "SCRAPER_SETTINGS",
    "RATE_LIMIT",
    "CLAUDE_SETTINGS",
    "REVIEW_ANALYSIS",
    "M1_SETTINGS",
    "M2_SETTINGS",
    "DATABASE_SETTINGS",
    "LOGGING",
    "OUTPUT_SETTINGS",
    "PROXY_SETTINGS",
    "FEATURES",
    "VALIDATION",
    "DEV_MODE",
]
