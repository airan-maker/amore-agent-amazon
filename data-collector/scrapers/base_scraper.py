"""
Base scraper class with Playwright integration
"""
import asyncio
import random
from abc import ABC, abstractmethod
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from loguru import logger
from typing import Optional, Dict, Any

from config.settings import (
    SCRAPER_SETTINGS,
    AMAZON_SETTINGS,
    USER_AGENTS_POOL,
    VIEWPORT_POOL,
    TIMEZONE_POOL,
    LOCALE_POOL
)
from utils.rate_limiter import rate_limiter


class BaseScraper(ABC):
    """
    Base class for all Amazon scrapers
    Handles browser initialization, rate limiting, and error handling
    """

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def initialize(self):
        """Initialize Playwright browser with enhanced anti-detection"""
        try:
            logger.info("Initializing Playwright browser with ENHANCED anti-detection...")
            self.playwright = await async_playwright().start()

            # Select random User-Agent from pool
            user_agent = random.choice(USER_AGENTS_POOL)
            logger.debug(f"Using User-Agent: {user_agent[:50]}...")

            # Select random viewport (to mimic different devices/users)
            viewport = random.choice(VIEWPORT_POOL)
            logger.debug(f"Using Viewport: {viewport['width']}x{viewport['height']}")

            # Select random timezone (US only)
            timezone = random.choice(TIMEZONE_POOL)
            logger.debug(f"Using Timezone: {timezone}")

            # Select random locale
            locale = random.choice(LOCALE_POOL)
            logger.debug(f"Using Locale: {locale}")

            # Launch browser with stealth settings
            self.browser = await self.playwright.chromium.launch(
                headless=SCRAPER_SETTINGS["headless"],
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--disable-accelerated-2d-canvas",
                    "--disable-gpu",
                ]
            )

            # Create context with realistic settings and randomized parameters
            self.context = await self.browser.new_context(
                viewport=viewport,  # RANDOMIZED viewport
                user_agent=user_agent,  # RANDOMIZED User-Agent
                locale=locale,  # RANDOMIZED locale
                timezone_id=timezone,  # RANDOMIZED timezone
                accept_downloads=False,
                has_touch=False,
                is_mobile=False,
                java_script_enabled=True,
                # Persistent storage for cookies (helps avoid bot detection)
                storage_state=None,  # Will be set after first successful session
            )

            # Set extra headers
            await self.context.set_extra_http_headers({
                "Accept-Language": AMAZON_SETTINGS["accept_language"],
                "Accept-Encoding": "gzip, deflate, br",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Referer": AMAZON_SETTINGS["base_url"],
                "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
            })

            # Create page
            self.page = await self.context.new_page()

            # Enhanced anti-detection script
            await self.page.add_init_script("""
                // Remove webdriver flag
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });

                // Mock plugins to appear real
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });

                // Add chrome object
                window.chrome = {
                    runtime: {}
                };

                // Mock languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });

                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );

                // Mock connection
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({
                        effectiveType: '4g',
                        rtt: 100,
                        downlink: 10,
                        saveData: false
                    })
                });
            """)

            logger.success("Browser initialized successfully with anti-detection")

        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            raise

    async def close(self):
        """Close browser and cleanup"""
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            logger.info("Browser closed successfully")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")

    async def goto(self, url: str, wait_until: str = "load", timeout: int = None, simulate_human: bool = True) -> bool:
        """
        Navigate to URL with rate limiting, error handling, and human behavior simulation

        Args:
            url: Target URL
            wait_until: Wait condition (load, domcontentloaded, networkidle)
            timeout: Custom timeout in seconds (overrides default)
            simulate_human: Whether to simulate human behavior after loading

        Returns:
            bool: True if navigation successful
        """
        if not self.page:
            raise RuntimeError("Browser not initialized. Call initialize() first.")

        # Apply rate limiting
        rate_limiter.wait_if_needed()

        # Use custom timeout or default (increased to 90 seconds)
        timeout_ms = (timeout or SCRAPER_SETTINGS["page_load_timeout"]) * 1000

        max_retries = SCRAPER_SETTINGS["max_retries"]
        retry_delay = SCRAPER_SETTINGS["retry_delay"]

        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    logger.info(f"Retry attempt {attempt + 1}/{max_retries} for: {url}")
                    # Exponential backoff
                    backoff_delay = retry_delay * (2 ** attempt)
                    logger.info(f"Waiting {backoff_delay}s before retry...")
                    await asyncio.sleep(backoff_delay)
                else:
                    logger.info(f"Navigating to: {url}")

                logger.debug(f"Timeout: {timeout_ms/1000}s, Wait until: {wait_until}")

                response = await self.page.goto(
                    url,
                    wait_until=wait_until,
                    timeout=timeout_ms
                )

                rate_limiter.record_request()

                if response and response.status == 200:
                    logger.success(f"Successfully loaded: {url}")

                    # Simulate human behavior after page load
                    if simulate_human:
                        await self._simulate_human_behavior()

                    return True
                elif response and response.status == 503:
                    # Service unavailable - retry with exponential backoff
                    logger.warning(f"503 Service Unavailable (attempt {attempt + 1}/{max_retries})")
                    continue
                else:
                    logger.warning(f"Non-200 status code: {response.status if response else 'None'}")
                    if attempt < max_retries - 1:
                        continue
                    return False

            except Exception as e:
                error_msg = str(e)

                # Handle different types of errors
                if "Timeout" in error_msg:
                    logger.warning(f"Timeout error (attempt {attempt + 1}/{max_retries})")

                    # If networkidle times out, try with 'load'
                    if wait_until == "networkidle" and attempt == 0:
                        logger.info("Retrying with 'load' strategy instead of 'networkidle'...")
                        wait_until = "load"
                        continue

                elif "net::ERR_ABORTED" in error_msg or "ERR_FAILED" in error_msg:
                    logger.warning(f"Connection error - possible bot detection (attempt {attempt + 1}/{max_retries})")

                    # Longer delay for bot detection errors
                    if attempt < max_retries - 1:
                        extra_delay = random.uniform(20, 40)
                        logger.info(f"Waiting extra {extra_delay:.1f}s to avoid bot detection...")
                        await asyncio.sleep(extra_delay)
                        continue

                else:
                    logger.error(f"Failed to navigate to {url}: {e}")

                if attempt == max_retries - 1:
                    logger.error(f"All {max_retries} attempts failed for {url}")
                    return False

        return False

    async def _simulate_human_behavior(self):
        """
        Simulate realistic human behavior after page loads
        """
        try:
            # Wait as if reading the page
            await self.simulate_human_reading()

            # Random mouse movements
            if random.random() > 0.5:  # 50% chance
                await self.simulate_mouse_movement()

            # Random scrolling
            if random.random() > 0.3:  # 70% chance
                await self.simulate_human_scroll(smooth=True)

        except Exception as e:
            logger.debug(f"Error in human behavior simulation: {e}")

    async def wait_for_selector(
        self,
        selector: str,
        timeout: int = 10000,
        state: str = "visible"
    ) -> bool:
        """
        Wait for element to appear

        Args:
            selector: CSS selector
            timeout: Max wait time in milliseconds
            state: Element state (visible, attached, hidden, detached)

        Returns:
            bool: True if element found
        """
        if not self.page:
            raise RuntimeError("Browser not initialized")

        try:
            await self.page.wait_for_selector(
                selector,
                timeout=timeout,
                state=state
            )
            return True
        except Exception as e:
            logger.debug(f"Selector not found: {selector} - {e}")
            return False

    async def extract_text(self, selector: str) -> Optional[str]:
        """Extract text content from selector"""
        if not self.page:
            return None

        try:
            element = await self.page.query_selector(selector)
            if element:
                text = await element.text_content()
                return text.strip() if text else None
        except Exception as e:
            logger.debug(f"Failed to extract text from {selector}: {e}")
        return None

    async def extract_attribute(self, selector: str, attribute: str) -> Optional[str]:
        """Extract attribute value from selector"""
        if not self.page:
            return None

        try:
            element = await self.page.query_selector(selector)
            if element:
                value = await element.get_attribute(attribute)
                return value.strip() if value else None
        except Exception as e:
            logger.debug(f"Failed to extract {attribute} from {selector}: {e}")
        return None

    async def screenshot(self, path: str):
        """Take screenshot for debugging"""
        if self.page:
            try:
                await self.page.screenshot(path=path, full_page=True)
                logger.debug(f"Screenshot saved: {path}")
            except Exception as e:
                logger.error(f"Failed to take screenshot: {e}")

    async def random_delay(self, min_seconds: float = 2, max_seconds: float = 4):
        """
        Add random delay to mimic human behavior

        Args:
            min_seconds: Minimum delay in seconds
            max_seconds: Maximum delay in seconds
        """
        delay = random.uniform(min_seconds, max_seconds)
        logger.debug(f"Random delay: {delay:.2f}s")
        await asyncio.sleep(delay)

    async def simulate_human_scroll(self, smooth: bool = True):
        """
        Simulate human-like scrolling behavior

        Args:
            smooth: Whether to use smooth scrolling
        """
        if not self.page:
            return

        try:
            # Get page height
            page_height = await self.page.evaluate("() => document.body.scrollHeight")

            if smooth:
                # Smooth scroll in chunks (like a human)
                scroll_steps = random.randint(5, 10)
                scroll_amount = page_height // scroll_steps

                for i in range(scroll_steps):
                    scroll_y = scroll_amount * (i + 1)
                    await self.page.evaluate(f"window.scrollTo({{top: {scroll_y}, behavior: 'smooth'}})")
                    await asyncio.sleep(random.uniform(0.3, 0.8))  # Short pause between scrolls

                logger.debug(f"Smooth scroll completed ({scroll_steps} steps)")
            else:
                # Quick scroll to bottom
                await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                logger.debug("Quick scroll to bottom")

            # Random pause after scrolling
            await self.random_delay(1, 2)

        except Exception as e:
            logger.debug(f"Error during scroll simulation: {e}")

    async def simulate_mouse_movement(self):
        """
        Simulate random mouse movements to appear more human-like
        """
        if not self.page:
            return

        try:
            # Move mouse to random positions
            for _ in range(random.randint(2, 4)):
                x = random.randint(100, 800)
                y = random.randint(100, 600)
                await self.page.mouse.move(x, y)
                await asyncio.sleep(random.uniform(0.1, 0.3))

            logger.debug("Mouse movement simulation completed")

        except Exception as e:
            logger.debug(f"Error during mouse movement: {e}")

    async def simulate_human_reading(self):
        """
        Simulate human reading time before interacting
        Adds a realistic delay as if user is reading the page
        """
        reading_time = random.uniform(2, 5)
        logger.debug(f"Simulating reading time: {reading_time:.1f}s")
        await asyncio.sleep(reading_time)

    async def save_cookies(self, filepath: str):
        """
        Save browser cookies to file for session persistence

        Args:
            filepath: Path to save cookies
        """
        if not self.context:
            return

        try:
            storage_state = await self.context.storage_state()
            import json
            with open(filepath, 'w') as f:
                json.dump(storage_state, f)
            logger.debug(f"Cookies saved to: {filepath}")
        except Exception as e:
            logger.debug(f"Error saving cookies: {e}")

    async def load_cookies(self, filepath: str):
        """
        Load browser cookies from file

        Args:
            filepath: Path to load cookies from
        """
        try:
            import json
            from pathlib import Path

            if Path(filepath).exists():
                with open(filepath, 'r') as f:
                    storage_state = json.load(f)

                # Apply storage state to context
                if self.context:
                    await self.context.add_cookies(storage_state.get('cookies', []))
                    logger.debug(f"Cookies loaded from: {filepath}")
                    return True
        except Exception as e:
            logger.debug(f"Error loading cookies: {e}")

        return False

    @abstractmethod
    async def scrape(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Main scraping logic - must be implemented by subclasses

        Returns:
            dict: Scraped data
        """
        pass

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
