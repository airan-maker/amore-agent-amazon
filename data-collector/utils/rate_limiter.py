"""
Rate limiter to prevent overwhelming Amazon servers
"""
import time
import random
from functools import wraps
from collections import deque
from datetime import datetime, timedelta
from loguru import logger

from config.settings import RATE_LIMIT, SCRAPER_SETTINGS


class RateLimiter:
    """
    Rate limiter using token bucket algorithm
    """

    def __init__(
        self,
        requests_per_minute: int = None,
        requests_per_hour: int = None,
        delay_min: int = None,
        delay_max: int = None
    ):
        self.requests_per_minute = requests_per_minute or RATE_LIMIT["requests_per_minute"]
        self.requests_per_hour = requests_per_hour or RATE_LIMIT["requests_per_hour"]
        self.delay_min = delay_min or SCRAPER_SETTINGS["delay_min"]
        self.delay_max = delay_max or SCRAPER_SETTINGS["delay_max"]

        # Track request timestamps
        self.minute_requests = deque()
        self.hour_requests = deque()

        logger.info(
            f"Rate limiter initialized: {self.requests_per_minute} req/min, "
            f"{self.requests_per_hour} req/hour, "
            f"{self.delay_min}-{self.delay_max}s delay"
        )

    def _clean_old_requests(self):
        """Remove timestamps older than tracking window"""
        now = datetime.now()

        # Clean minute window
        minute_ago = now - timedelta(minutes=1)
        while self.minute_requests and self.minute_requests[0] < minute_ago:
            self.minute_requests.popleft()

        # Clean hour window
        hour_ago = now - timedelta(hours=1)
        while self.hour_requests and self.hour_requests[0] < hour_ago:
            self.hour_requests.popleft()

    def can_make_request(self) -> bool:
        """Check if we can make a request without exceeding rate limits"""
        self._clean_old_requests()

        if len(self.minute_requests) >= self.requests_per_minute:
            return False

        if len(self.hour_requests) >= self.requests_per_hour:
            return False

        return True

    def wait_if_needed(self):
        """Block until we can make a request"""
        while not self.can_make_request():
            logger.warning("Rate limit reached, waiting...")
            time.sleep(5)  # Check every 5 seconds

        # Random delay to mimic human behavior
        delay = random.uniform(self.delay_min, self.delay_max)
        logger.debug(f"Waiting {delay:.2f}s before request")
        time.sleep(delay)

    def record_request(self):
        """Record that a request was made"""
        now = datetime.now()
        self.minute_requests.append(now)
        self.hour_requests.append(now)

        logger.debug(
            f"Requests in last minute: {len(self.minute_requests)}/{self.requests_per_minute}, "
            f"last hour: {len(self.hour_requests)}/{self.requests_per_hour}"
        )

    def __call__(self, func):
        """Decorator to rate limit a function"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            self.wait_if_needed()
            result = func(*args, **kwargs)
            self.record_request()
            return result
        return wrapper


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limited(func):
    """
    Decorator to apply rate limiting to a function

    Usage:
        @rate_limited
        def scrape_page(url):
            ...
    """
    return rate_limiter(func)
