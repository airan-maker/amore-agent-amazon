"""
Rate limiter to prevent overwhelming Amazon servers
Enhanced with human-like behavior patterns for bot detection evasion
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
    Enhanced rate limiter with human-like behavior patterns
    - Gaussian distribution for delays (more natural than uniform)
    - Time-of-day awareness
    - Random long pauses (coffee breaks)
    - Session rotation tracking
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

        # Session tracking for rotation
        self.session_request_count = 0
        self.rotation_threshold = self._calculate_rotation_threshold()

        # Track total requests for statistics
        self.total_requests = 0
        self.total_delay_time = 0

        logger.info(
            f"Enhanced rate limiter initialized: {self.requests_per_minute} req/min, "
            f"{self.requests_per_hour} req/hour, "
            f"{self.delay_min}-{self.delay_max}s base delay, "
            f"Session rotation at ~{self.rotation_threshold} requests"
        )

    def _calculate_rotation_threshold(self) -> int:
        """Calculate when to rotate session with jitter"""
        base = SCRAPER_SETTINGS.get("session_rotation_interval", 50)
        jitter = SCRAPER_SETTINGS.get("session_rotation_jitter", 10)
        return base + random.randint(-jitter, jitter)

    def _is_peak_hours(self) -> bool:
        """Check if current time is during peak browsing hours (US timezone)"""
        # Use a rough estimate - actual timezone handling would need pytz
        utc_hour = datetime.utcnow().hour

        # Map to approximate US times (EST = UTC-5, PST = UTC-8)
        # This is a simplification - actual users are spread across timezones
        us_hours = [(utc_hour - offset) % 24 for offset in range(5, 9)]

        peak_start = SCRAPER_SETTINGS.get("peak_hours_start", 8)
        peak_end = SCRAPER_SETTINGS.get("peak_hours_end", 23)

        # Return True if any US timezone is in peak hours
        return any(peak_start <= h <= peak_end for h in us_hours)

    def _gaussian_delay(self) -> float:
        """
        Generate delay using Gaussian distribution (more human-like)
        Mean is centered between min and max, with standard deviation
        ensuring most values fall within the range
        """
        mean = (self.delay_min + self.delay_max) / 2
        std_dev = (self.delay_max - self.delay_min) / 4  # 95% within range

        delay = random.gauss(mean, std_dev)
        # Clamp to valid range
        delay = max(self.delay_min, min(self.delay_max, delay))

        return delay

    def _should_take_long_pause(self) -> bool:
        """Randomly decide if we should simulate a coffee break"""
        probability = SCRAPER_SETTINGS.get("long_pause_probability", 0.05)
        return random.random() < probability

    def _get_long_pause_duration(self) -> float:
        """Get duration for a long pause (coffee break simulation)"""
        min_pause = SCRAPER_SETTINGS.get("long_pause_min", 120)
        max_pause = SCRAPER_SETTINGS.get("long_pause_max", 300)
        return random.uniform(min_pause, max_pause)

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
        """
        Block until we can make a request with human-like timing patterns
        - Uses Gaussian distribution for more natural delays
        - Applies time-of-day multiplier (slower during off-peak)
        - Randomly inserts long pauses (coffee breaks)
        """
        while not self.can_make_request():
            logger.warning("Rate limit reached, waiting...")
            time.sleep(5)  # Check every 5 seconds

        # Check for long pause (coffee break simulation)
        if self._should_take_long_pause():
            pause_duration = self._get_long_pause_duration()
            logger.info(f"☕ Taking a coffee break: {pause_duration/60:.1f} minutes")
            time.sleep(pause_duration)
            self.total_delay_time += pause_duration

        # Use Gaussian distribution for more human-like delays
        delay = self._gaussian_delay()

        # Apply time-of-day multiplier (slower during off-peak hours)
        if not self._is_peak_hours():
            multiplier = SCRAPER_SETTINGS.get("off_peak_delay_multiplier", 1.5)
            delay *= multiplier
            logger.debug(f"Off-peak hours: applying {multiplier}x delay multiplier")

        # Add micro-jitter (±10%) for unpredictability
        jitter = delay * random.uniform(-0.1, 0.1)
        delay += jitter

        logger.debug(f"Waiting {delay:.2f}s before request (peak hours: {self._is_peak_hours()})")
        time.sleep(delay)
        self.total_delay_time += delay

    def record_request(self):
        """Record that a request was made and track session for rotation"""
        now = datetime.now()
        self.minute_requests.append(now)
        self.hour_requests.append(now)

        # Update counters
        self.session_request_count += 1
        self.total_requests += 1

        logger.debug(
            f"Requests - minute: {len(self.minute_requests)}/{self.requests_per_minute}, "
            f"hour: {len(self.hour_requests)}/{self.requests_per_hour}, "
            f"session: {self.session_request_count}/{self.rotation_threshold}"
        )

    def should_rotate_session(self) -> bool:
        """Check if browser session should be rotated to avoid fingerprinting"""
        return self.session_request_count >= self.rotation_threshold

    def reset_session_count(self):
        """Reset session counter after rotation and calculate new threshold"""
        self.session_request_count = 0
        self.rotation_threshold = self._calculate_rotation_threshold()
        logger.info(f"Session counter reset. Next rotation at ~{self.rotation_threshold} requests")

    def get_statistics(self) -> dict:
        """Get rate limiter statistics for monitoring"""
        avg_delay = self.total_delay_time / max(1, self.total_requests)
        return {
            "total_requests": self.total_requests,
            "total_delay_time_seconds": round(self.total_delay_time, 2),
            "average_delay_seconds": round(avg_delay, 2),
            "session_requests": self.session_request_count,
            "rotation_threshold": self.rotation_threshold,
        }

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
